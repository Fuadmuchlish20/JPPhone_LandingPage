# claudeemulator.net — cloud Android phones in the browser

Users sign up, get virtual Android devices (Redroid containers), and control them live
from the browser (touch, keyboard, audio, clipboard, APK install). Devices keep running
24/7 when the tab is closed.

```
Browser ──HTTPS──▶ Next.js on Vercel (apps/web) ──HMAC REST──▶ device-agent (per host)
   │                     │  Supabase (auth, Postgres, RLS)          │ dockerode → redroid containers
   │                     ▲                                          │ adb → scrcpy-server (in Android)
   └──wss + 60s JWT──────┼──────────────────────────▶ Caddy :443 ───┘ H.264/Opus → WebSocket
                         └──── heartbeat / device status (service role) ◀┘
```

## Repository

| Path | What |
|---|---|
| `apps/web` | Next.js 16 App Router: landing, pricing, auth, dashboard, player, admin, cron scheduler |
| `apps/device-agent` | Node service per host: REST API, Redroid lifecycle, loop-mounted storage, scrcpy ↔ WebSocket gateway |
| `packages/shared` | Types, wire protocol + scrcpy control encoders, HMAC + JWT helpers |
| `infra/supabase` | SQL migration (schema, RLS, `allocate_device`), seed plans, local CLI config |
| `infra/host` | `docker-compose.yml` (agent + Caddy), `Caddyfile`, host `.env.example` |
| `infra/scripts` | `setup-host.sh` (kernel modules, network isolation, firewall), `fetch-broadway.sh` |

## How a session works

1. Dashboard → server action → `allocate_device()` (checks plan + device limit, picks the
   least-loaded online host in the region, inserts row) → agent `POST /api/devices`.
2. Agent creates a sparse ext4 image (hard storage limit), loop-mounts it, starts a Redroid
   container with CPU/RAM limits, waits for `sys.boot_completed`, marks the device `running`.
3. Player calls `/api/devices/:id/stream-token` → 60s JWT + `wss://hostN…/stream/:id`.
   Token travels in the WebSocket subprotocol header (not the URL).
4. Agent verifies JWT + ownership, pushes `scrcpy-server` over adb, opens video/audio/control
   sockets and relays them. Browser decodes H.264 with WebCodecs (Broadway fallback) and
   Opus with `AudioDecoder`, and sends scrcpy control messages back.
5. One viewer per device: opening it elsewhere closes the previous tab (`4001`).
6. Agent heartbeats every 30s, restarts crashed devices (crash-loop guard), and on host
   reboot remounts volumes and starts every device that should be running.
7. Vercel Cron (`/api/cron/scheduler`, every 5 min) stops devices whose plan expired or
   that exceeded the plan's `idle_stop_minutes` (null = always on), and marks silent hosts offline.

## Local development

Requirements: Node 22+, Docker, Supabase CLI. Redroid needs a **Linux** machine with the
`binder_linux` module (`sudo bash infra/scripts/setup-host.sh` on a test VM does everything).

```bash
npm install

# 1. Supabase (local)
supabase start --workdir infra          # prints API URL, anon + service_role keys
supabase db reset --workdir infra       # applies migration + seed plans

# 2. Web
cp apps/web/.env.example apps/web/.env.local   # fill Supabase URL/keys, secrets
#    NEXT_PUBLIC_SITE_URL=http://localhost:3000
npm run dev:web                                 # http://localhost:3000

# 3. Register a user, then make it admin and give it a plan:
#    update profiles set is_admin = true where email = 'you@example.com';
#    Admin → Hosts → add host: region "local", URL http://localhost:8080, capacity 4
#    Admin → Users → Grant plan

# 4. Agent (on the Linux box, as root because of loop mounts + docker socket)
docker network create --subnet 172.31.0.0/16 \
  -o com.docker.network.bridge.name=br-redroid \
  -o com.docker.network.bridge.enable_icc=false redroid-net   # setup-host.sh does this
mkdir -p /opt/scrcpy && curl -fsSL -o /opt/scrcpy/scrcpy-server.jar \
  https://github.com/Genymobile/scrcpy/releases/download/v3.3.1/scrcpy-server-v3.3.1
cp apps/device-agent/.env.example apps/device-agent/.env
#    HOST_ID=<id from admin hosts table>, same secrets as web,
#    WEB_ORIGIN=http://localhost:3000, STORAGE_MODE=dir for quick tests
sudo npm run dev:agent                          # listens on 127.0.0.1:8080
```

With the agent on `http://localhost:8080` the browser connects to `ws://localhost:8080/stream/…`
directly (no Caddy needed locally).

Optional: `bash infra/scripts/fetch-broadway.sh` to enable the software-decoder fallback
for browsers without WebCodecs.

## Production

### Supabase
- Create a project, run `supabase db push --workdir infra` (or paste the migration in the SQL editor), then `seed.sql`.
- Auth → URL configuration: site URL `https://claudeemulator.net`, redirect `https://claudeemulator.net/auth/callback`.
- Google sign-in: in Google Cloud console create an OAuth client (type "Web application") with the authorized
  redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, then paste the client ID/secret in
  Supabase → Authentication → Providers → Google and enable it. The site's `/auth/callback` must be in the
  Supabase redirect allow-list (above).

### Web (Vercel)
- Import the repo, **Root Directory = `apps/web`** (npm workspaces are installed from the repo root).
- Env vars from `apps/web/.env.example`. `AGENT_HMAC_SECRET` / `STREAM_JWT_SECRET`: `openssl rand -hex 32`.
- `vercel.json` registers the cron (every 5 min requires a Pro plan; Hobby runs crons daily).

### Each device host
```bash
git clone <repo> && cd <repo>
sudo bash infra/scripts/setup-host.sh       # binder, sysctl, rshared /data/devices, network, firewall, ufw
# Admin → Hosts → add host (public_url https://hostN.claudeemulator.net) → copy Host ID
cd infra/host && cp .env.example .env       # HOST_ID, HOST_DOMAIN, secrets, Supabase service key
# DNS: A record hostN.claudeemulator.net → server IP
docker compose up -d --build
docker compose logs -f device-agent         # "listening", then heartbeats → host turns online
```

Android versions: `plans.android_versions` lists what users can pick (seed: 10, 12, 13, 15). Each host maps
versions to Redroid images with `REDROID_IMAGES` (`10=redroid/redroid:10.0.0-latest,…`); every host should offer
every version a plan lists, or creation fails with `unsupported_android_version`. The agent pre-pulls all of them.
scrcpy captures audio only on Android 11+, so Android 10 devices stream without sound.

ARM64 servers (Ampere, Hetzner CAX…) run ARM-only apps/games natively, like commercial
cloud-phone services. On x86 most games need an ARM translation layer (libndk/libhoudini)
baked into a custom Redroid image — set `REDROID_IMAGE` to that image.

### Sizing (per device, 720×1280 @ 30 fps)

| | Light (apps, idle farming) | Games |
|---|---|---|
| vCPU | 1–2 | 2–4 |
| RAM | 2 GB | 3–4 GB |
| Disk | 8 GB (+ ~3 GB shared image) | 16–32 GB |
| Stream | 1.5–3 Mbps | 3–6 Mbps |

A 16 vCPU / 32 GB host fits ~10–12 light devices; reserve ~15 % for host + agent.
Without a GPU, Redroid renders in software (fine for apps/2D); set `REDROID_GPU_MODE=host`
on hosts with `/dev/dri`.

## Security model
- ADB (5555) and the Docker socket are never exposed; devices sit on an ICC-disabled bridge,
  can't reach host services, private ranges or cloud metadata (`ce-firewall.service`).
- UFW allows only 22/80/443. Caddy terminates TLS; the agent listens on 127.0.0.1.
- Web → agent REST: HMAC-SHA256 over timestamp + method + path + body hash (60s skew).
  Optionally pin `AGENT_API_ALLOWED_IPS` in Caddy.
- Browser → agent: 60s HS256 JWT scoped to `stream` or `apk`, host and device; ownership and
  `running` state re-checked against Supabase.
- RLS: users read only their own profile/devices/subscriptions/sessions; `hosts` is server-only;
  `profiles.is_admin` isn't user-writable; `allocate_device` is service-role only.
- The agent uses the Supabase service-role key (heartbeat + status updates). Treat hosts as trusted.

## Not included
- Payment provider: plans are granted from Admin → Users or with redeem codes (Admin → Redeem codes);
  `checkoutAction` / `grantPlanAction` are the hook points. Every activation is recorded in `orders`
  and the user gets an in-app message (`messages`).
- Wallet: users pay for plans from their balance (`wallet_purchase`). Balance is added by admins
  (Admin → Users → Wallet, `wallet_adjust`) or through top-ups: the Top-up page creates a pending
  `wallet_topups` row and an admin confirms it under Admin → Top-ups (`wallet_topup_complete`).
  To automate, create the provider payment in `createTopupAction` and call `wallet_topup_complete` from its webhook.
- Google Play / GApps in the image (requires licensing).
