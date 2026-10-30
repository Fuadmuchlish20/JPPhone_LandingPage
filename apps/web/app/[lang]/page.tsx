import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LOCALES, dirOf, isLocale, langTag, localeHome, type Locale } from "@/lib/i18n/config";
import { HOME, place, type HomeDict } from "@/lib/i18n/home";
import { homeMetadata } from "@/lib/i18n/metadata";
import { formatPrice, formatRam } from "@/lib/format";
import { FALLBACK_PLANS } from "@/lib/plans/fallback";
import { packagePrice } from "@/lib/plans/packages";
import { PAYMENT_METHODS } from "@/lib/wallet/topup";

// The landing page is fully static: one HTML file per locale, rendered at build time.
// English is served at "/" (app/page.tsx renders this page with lang "en"); "/id" and "/de" come from here.
// Plan cards use FALLBACK_PLANS (mirrors infra/supabase/seed.sql) — update both when prices change.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== "en").map((lang) => ({ lang }));
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jpphone.com").replace(/\/$/, "");
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? homeMetadata(lang) : {};
}

/* ---------------------------------------------------------------- content */

const PLATFORMS = [
  { name: "Browser", color: "#1a73e8", icon: "globe" },
  { name: "Windows", color: "#0078d4", icon: "windows" },
  { name: "macOS", color: "#111318", icon: "apple" },
  { name: "Android", color: "#3ddc84", icon: "android" },
  { name: "iOS", color: "#007aff", icon: "phone" },
] as const;

// Sample latencies (from Jakarta) for the illustration; `left` puts the label left of the dot.
const NODES: { name: string; ms: number; x: number; y: number; left?: boolean }[] = [
  { name: "Jakarta", ms: 9, x: 76, y: 64 },
  { name: "Singapore", ms: 18, x: 73, y: 57 },
  { name: "Vietnam", ms: 32, x: 75, y: 49 },
  { name: "Thailand", ms: 35, x: 70, y: 47, left: true },
  { name: "Hong Kong", ms: 42, x: 79, y: 40 },
  { name: "Taiwan", ms: 48, x: 83, y: 36 },
  { name: "Tokyo", ms: 65, x: 87, y: 27 },
  { name: "Frankfurt", ms: 96, x: 50, y: 28 },
  { name: "US West", ms: 142, x: 16, y: 34 },
];

const PLAN_THEMES: Record<string, string> = { uvip: "slate", gvip: "bronze", kvip: "violet", mvip: "teal", svip: "rose" };
const HOT_PLANS = new Set(["mvip"]);
// Regions every plan can deploy to — keep in sync with the regions of your hosts (Admin → Hosts).
// 3 cards are visible at a time, so there are (plans - 2) slider positions.
const PLAN_POSITIONS = Array.from({ length: Math.max(1, FALLBACK_PLANS.length - 2) }, (_, i) => i);
const PLAN_SERVERS = ["Indonesia", "Singapore", "Vietnam", "Thailand", "Hong Kong", "Taiwan", "United States", "Germany"];

// Game artwork in public/games (640×360 sources, shown as 300×180 landscape tiles).
const GAME_SHOTS: { file: string; name: string }[] = [
  { file: "night-crows", name: "Night Crows" },
  { file: "lineage-2m", name: "Lineage 2M" },
  { file: "black-desert-mobile", name: "Black Desert Mobile" },
  { file: "ragnarok-origin", name: "Ragnarok Origin" },
  { file: "mobile-legends", name: "Mobile Legends" },
  { file: "free-fire", name: "Free Fire" },
  { file: "lineage-m", name: "Lineage M" },
  { file: "maplestory-m", name: "MapleStory M" },
  { file: "hit2", name: "HIT2" },
  { file: "ni-no-kuni", name: "Ni no Kuni" },
  { file: "seven-knights", name: "Seven Knights" },
  { file: "rom", name: "ROM: Remember of Majesty" },
  { file: "lineage-2", name: "Lineage II" },
  { file: "ragnarok-online", name: "Ragnarok Online" },
  { file: "evil-hunter-tycoon", name: "Evil Hunter Tycoon" },
  { file: "slayer-legend", name: "Slayer Legend" },
  { file: "mana-striker", name: "Mana Striker" },
  { file: "crasher-nirvana", name: "Crasher: Nirvana" },
  { file: "teenage-mercenary", name: "Teenage Mercenary" },
  { file: "ragnarok-new-generation", name: "Ragnarok: New Generation" },
  { file: "ragnarok-origin-tw", name: "Ragnarok Origin (TW)" },
  { file: "ragnarok-valkyrie", name: "Ragnarok Valkyrie" },
  { file: "black-desert", name: "Black Desert" },
  { file: "new-romance-of-the-three-kingdoms", name: "New Romance of the Three Kingdoms" },
  { file: "ts-online-mobile", name: "TS Online Mobile" },
  { file: "ts-online-mobile-2", name: "TS Online Mobile 2.0" },
  { file: "vo-lam-thien-tuyet", name: "Võ Lâm Thiên Tuyệt" },
];
// Two scrolling columns: alternate games between them.
const WALL_COLUMNS = [GAME_SHOTS.filter((_, i) => i % 2 === 0), GAME_SHOTS.filter((_, i) => i % 2 === 1)];

// Sample copy for layout only — replace with real reviews before launch.
const REVIEW_ROWS: { text: string; hot?: boolean }[][] = [
  [
    { text: "the best cloud phone I've ever used", hot: true },
    { text: "it's good, all working 😁" },
    { text: "amazing and reliable 🥰", hot: true },
    { text: "nice app, good for grinding games while I sleep" },
    { text: "runs multiple apps smoothly!" },
  ],
  [
    { text: "great service, great app, highly recommended" },
    { text: "best service out there 🥰" },
    { text: "very great app, I like it!" },
    { text: "good experience, use this app" },
    { text: "very useful for AFK in game", hot: true },
  ],
  [
    { text: "low cost, good app 👍" },
    { text: "the performance is good and very good support" },
    { text: "the app is great, the staff is very helpful", hot: true },
    { text: "support team is very responsive" },
    { text: "my farm keeps going 24/7, love it" },
  ],
];

// Sample data for layout only — publish only rankings you can back with real numbers.
const TOP1 = [
  { code: "id", name: "Indonesia" },
  { code: "vn", name: "Vietnam" },
  { code: "ph", name: "Philippines" },
];
const TOP_REST = [
  { rank: 6, code: "br", name: "Brazil" },
  { rank: 7, code: "kr", name: "South Korea" },
  { rank: 8, code: "jp", name: "Japan" },
  { rank: 9, code: "tr", name: "Turkey" },
];

// Icons and tints for the "Supporting Features" cards (titles/texts come from the dictionary).
const SUPPORT_FEATURE_STYLE: { icon: FeatureIconName; tint: string }[] = [
  { icon: "phone", tint: "#8b6bf2" },
  { icon: "sliders", tint: "#4bb8c9" },
  { icon: "download", tint: "#c08a4a" },
  { icon: "folder", tint: "#e2566a" },
  { icon: "camera", tint: "#8fa3c7" },
  { icon: "mic", tint: "#d10034" },
];

/* ---------------------------------------------------------------- JSON-LD */

function jsonLd(t: HomeDict, locale: Locale) {
  const url = `${SITE_URL}${localeHome(locale) === "/" ? "" : localeHome(locale)}`;
  return {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "JPPhone",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "JPPhone",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: langTag(locale),
    },
    {
      "@type": "SoftwareApplication",
      name: "JPPhone Android Cloud Phone",
      applicationCategory: "GameApplication",
      operatingSystem: "Android (cloud); controlled from any web browser",
      description: t.meta.description,
      url,
      inLanguage: langTag(locale),
      offers: FALLBACK_PLANS.map((p) => ({
        "@type": "Offer",
        name: `${p.name} — ${p.period_days} days`,
        price: packagePrice(p, p.period_days).total.toFixed(2),
        priceCurrency: p.currency,
        url: `${SITE_URL}/register?plan=${p.slug}`,
        availability: "https://schema.org/InStock",
      })),
    },
    {
      "@type": "FAQPage",
      inLanguage: langTag(locale),
      mainEntity: t.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
  };
}

/* ---------------------------------------------------------------- page */

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = HOME[lang];
  const dir = dirOf(lang);

  return (
    // lang marks the language of the page content for search engines and screen readers.
    <div lang={langTag(lang)} dir={dir}>
      <script
        type="application/ld+json"
        // "<" is escaped so the JSON can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(t, lang)).replace(/</g, "\\u003c") }}
      />

      {/* ---------------- hero ---------------- */}
      <section className="lp-hero" aria-labelledby="hero-title">
        <div className="container lp-hero-inner">
          <span className="lp-eyebrow">JPPhone</span>
          <h1 className="lp-title" id="hero-title">
            {t.hero.line1}
            <br />
            {t.hero.for && `${t.hero.for} `}
            <span className="lp-accent">{t.hero.accent}</span>
          </h1>
          <p className="lp-lead">{t.hero.lead}</p>
          <ul className="lp-features">
            {t.hero.features.map((f) => (
              <li key={f}>
                <CheckMark />
                {f}
              </li>
            ))}
          </ul>

          <Link href="/register" className="lp-cta">
            {t.hero.cta}
          </Link>

          <ul className="lp-platforms" aria-label={t.hero.worksOn}>
            {PLATFORMS.map((p) => (
              <li key={p.name} className="lp-platform" style={{ ["--c" as string]: p.color }}>
                <PlatformIcon name={p.icon} />
                <strong>{p.name}</strong>
                <span>{t.hero.noInstall}</span>
              </li>
            ))}
          </ul>

          <div className="lp-stage" aria-hidden dir="ltr">
            <div className="lp-glow" />
            <div className="lp-float lp-float-hosting">
              <span className="lp-dot-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              {t.hero.hosting}
            </div>
            <div className="lp-float lp-float-auto">
              <strong>AUTO</strong>
              <span>{t.hero.autoSub}</span>
            </div>
            <div className="lp-float lp-float-multi">
              <strong>{t.hero.multi}</strong>
              <span>{t.hero.multiSub}</span>
            </div>

            <div className="lp-desktop">
              <div className="lpm-bar">
                <span className="lp-win-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="lpm-url">dashboard.jpphone.com</span>
              </div>
              <div className="hm-body">
                <div className="hm-side">
                  <div className="hm-who">
                    <span className="hm-avatar">X</span>
                    <span>
                      <b>Xio Jue</b>
                      <small>ID: 19708237</small>
                    </span>
                  </div>
                  <div className="hm-quick">
                    <span>
                      <i />
                      Redeem
                    </span>
                    <span>
                      <i />
                      Buy
                    </span>
                    <span>
                      <i />
                      Plan
                    </span>
                  </div>
                  <div className="hm-wallet">
                    <small>Wallet Balance</small>
                    <span>
                      <b>$12.50</b>
                      <em>Top-up</em>
                    </span>
                  </div>
                  <small className="hm-title">My cloud phones</small>
                  <span className="hm-group">
                    All devices <em>8</em>
                  </span>
                  <small className="hm-title">Account</small>
                  {["Redeem Code", "Subscriptions", "Messages", "Order History", "Support"].map((m) => (
                    <span key={m} className="hm-menu">
                      {m}
                      <i>›</i>
                    </span>
                  ))}
                </div>
                <div className="hm-main">
                  <div className="hm-head">
                    <b>My Cloud Phones</b>
                    <span>+ New device</span>
                  </div>
                  <div className="hm-grid">
                    {["Lineage Farm 1", "Lineage Farm 2", "MIR4 Grind", "Roblox AFK", "Odin Main", "Gacha 1", "Gacha 2", "Test"].map((name, i) => (
                      <div key={name} className="hm-card">
                        <div className="hm-screen">
                          <AndroidScreen dim={i === 6} />
                          <span className={`hm-status${i === 6 ? " is-off" : ""}`}>{i === 6 ? "Off" : "Running"}</span>
                          {i === 3 ? (
                            <span className="hm-expire">
                              Expires in 1d <i>Renew</i>
                            </span>
                          ) : (
                            <span className="hm-left">{i % 3 === 0 ? "12d left" : "19d left"}</span>
                          )}
                        </div>
                        <div className="hm-info">
                          <span>
                            <b>{name}</b>
                            <small>8C · 8 GB · Android 13</small>
                          </span>
                          <i className="hm-gear" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-phone">
              <div className="lp-phone-notch" />
              <div className="lpm-phone-screen">
                <AndroidScreen />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- why choose (CSS-only tabs: radio + :checked, no JavaScript) ---------------- */}
      <section className="wc" aria-labelledby="why-title">
        <div className="container">
          <h2 className="wc-title" id="why-title">
            {t.why.before && `${t.why.before} `}
            <span className="lp-accent">JPPhone</span>
            {t.why.after}
          </h2>
          <span className="wc-chevron" aria-hidden />

          {t.why.items.map((w, i) => (
            <input key={w.title} type="radio" name="why" id={`why-${i + 1}`} className="wc-radio" defaultChecked={i === 0} aria-label={w.title} />
          ))}

          <div className="wc-grid">
            <div className="wc-tabs" aria-hidden>
              {t.why.items.map((w, i) => (
                <label key={w.title} htmlFor={`why-${i + 1}`} className="wc-tab">
                  {w.title}
                </label>
              ))}
            </div>

            <div className="wc-visual-wrap">
              {t.why.items.map((w, i) => (
                <div key={w.title} className={`wc-panel wc-panel-${i + 1}`}>
                  <div className="wc-visual" aria-hidden dir="ltr">
                    {i === 0 && (
                      <div className="wc-multi">
                        <div className="wc-games">
                          {[200, 28, 140, 260, 340, 90].map((h) => (
                            <span key={h} className="wc-game" style={{ ["--h" as string]: h }}>
                              <i />
                              <i />
                              <i />
                            </span>
                          ))}
                        </div>
                        <div className="wc-phones">
                          {["Lineage Farm 1", "Lineage Farm 2", "MIR4 Grind", "Roblox AFK"].map((name) => (
                            <div key={name} className="wc-pcard">
                              <div className="wc-pscreen">
                                <AndroidScreen />
                                <span className="wc-pstatus">Running</span>
                                <span className="wc-pleft">19d left</span>
                              </div>
                              <div className="wc-pinfo">
                                <span>
                                  <b>{name}</b>
                                  <small>8C · 8 GB · Android 13</small>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="wc-online">
                        <span className="wc-online-label">
                          <i /> {t.why.deviceRunning}
                        </span>
                        <strong className="wc-uptime">
                          23<em>:</em>59<em>:</em>41
                        </strong>
                        <span className="wc-online-sub">{t.why.uptimeToday}</span>
                        <div className="wc-bars">
                          {Array.from({ length: 30 }, (_, d) => (
                            <span key={d} className={d === 11 ? "is-dip" : undefined} />
                          ))}
                        </div>
                        <div className="wc-bars-legend">
                          <span>{t.why.daysAgo}</span>
                          <span>{t.why.online}</span>
                          <span>{t.why.today}</span>
                        </div>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="wc-nodes">
                        <div className="wc-map">
                          {NODES.map((n) => (
                            <span key={n.name} className={`wc-node${n.left ? " is-left" : ""}`} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
                              <b>{place(t, n.name)}</b>
                            </span>
                          ))}
                        </div>
                        <ul className="wc-pings">
                          {NODES.map((n) => (
                            <li key={n.name}>
                              <span>{place(t, n.name)}</span>
                              <span className="wc-ping-bar">
                                <i style={{ width: `${Math.max(8, 100 - n.ms / 1.6)}%` }} />
                              </span>
                              <code>{n.ms} ms</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {i === 3 && (
                      <div className="wc-pay">
                        <div className="wc-pay-head">
                          <span>{t.why.wallet}</span>
                          <strong>$12.50</strong>
                        </div>
                        <div className="wc-pay-grid">
                          {PAYMENT_METHODS.map((m, mi) => (
                            <span key={m.id} className={`wc-pay-method${mi === 0 ? " is-active" : ""}`} style={{ ["--c" as string]: m.color }}>
                              {m.name}
                            </span>
                          ))}
                        </div>
                        <div className="wc-pay-confirm">{t.why.confirm} $6.99</div>
                      </div>
                    )}
                    {i === 4 && (
                      <div className="wc-cross">
                        <span className="wc-cross-hub">
                          <span className="hm-avatar">C</span>
                          JPPhone
                        </span>
                        <ul className="wc-cross-grid">
                          {PLATFORMS.map((p) => (
                            <li key={p.name} style={{ ["--c" as string]: p.color }}>
                              <PlatformIcon name={p.icon} />
                              <strong>{p.name}</strong>
                              <span>{t.why.connected}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <h3 className="sr-only">{w.title}</h3>
                  <p className="wc-caption">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- plans ---------------- */}
      <section className="dm" aria-labelledby="plans-title">
        <div className="container dm-head">
          <h2 className="wc-title" id="plans-title">
            {t.plans.before} <span className="lp-accent">{t.plans.accent}</span>
          </h2>
          <span className="wc-chevron" aria-hidden />
        </div>
        {/* CSS-only slider: each radio is a scroll position; the arrows are labels for the neighbouring radio. */}
        {PLAN_POSITIONS.map((pos) => (
          <input
            key={pos}
            type="radio"
            name="plans-pos"
            id={`plans-pos-${pos}`}
            className="dm-radio"
            defaultChecked={pos === Math.min(1, PLAN_POSITIONS.length - 1)}
            aria-label={t.plans.show(pos + 1, pos + 3)}
          />
        ))}
        <div className="dm-carousel" dir="ltr">
          {PLAN_POSITIONS.map((pos) => (
            <SliderArrow key={`prev-${pos}`} dir="prev" at={pos} to={pos > 0 ? pos - 1 : null} />
          ))}
          {PLAN_POSITIONS.map((pos) => (
            <SliderArrow key={`next-${pos}`} dir="next" at={pos} to={pos < PLAN_POSITIONS.length - 1 ? pos + 1 : null} />
          ))}
          <div className="dm-track dm-track-static">
            <div className="dm-row">
              {FALLBACK_PLANS.map((p) => (
                <article key={p.slug} className={`dm-card dm-${PLAN_THEMES[p.slug] ?? "slate"}`} dir={dir}>
                  <span className="dm-watermark" aria-hidden>
                    {p.name}
                  </span>
                  {HOT_PLANS.has(p.slug) && <span className="dm-hot">{t.plans.hot}</span>}
                  <h3 className="dm-name">
                    <span className="dm-badge" aria-hidden>
                      {p.name.charAt(0)}
                    </span>
                    {p.name}
                  </h3>
                  <p className="dm-tagline">{t.plans.taglines[p.slug] ?? p.description}</p>

                  <dl className="dm-specs">
                    <div className="dm-spec">
                      <dt className="sr-only">CPU</dt>
                      <dd>
                        {Number(p.cpu)} {t.plans.cores}
                      </dd>
                    </div>
                    <div className="dm-spec">
                      <dt className="sr-only">RAM</dt>
                      <dd>{formatRam(p.ram_mb).replace(" ", "")} RAM</dd>
                    </div>
                    <div className="dm-spec">
                      <dt className="sr-only">Storage</dt>
                      <dd>{p.storage_gb}G ROM</dd>
                    </div>
                  </dl>

                  <div className="dm-block">
                    <span className="dm-label">{t.plans.servers}</span>
                    <ul className="dm-servers">
                      {PLAN_SERVERS.map((r) => (
                        <li key={r}>
                          <CheckMark />
                          {place(t, r)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="dm-block">
                    <span className="dm-label">{t.plans.system}</span>
                    <div className="dm-tags">
                      {p.android_versions.map((v) => (
                        <span key={v}>Android {v}</span>
                      ))}
                    </div>
                  </div>
                  <div className="dm-foot">
                    {(() => {
                      const pr = packagePrice(p, p.period_days);
                      return (
                        <p className="dm-price">
                          {formatPrice(pr.total, p.currency)}
                          {pr.discountPct > 0 && <s className="dm-was">{formatPrice(pr.regular, p.currency)}</s>}
                          <span>{t.plans.perDays(p.period_days)}</span>
                        </p>
                      );
                    })()}
                    <Link href={`/register?plan=${p.slug}`} className="dm-play">
                      {t.plans.play}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- games ---------------- */}
      <section className="gw" aria-labelledby="games-title">
        <div className="container gw-grid">
          <div className="gw-copy">
            <h2 id="games-title">
              {t.games.line1}
              <br />
              <span className="lp-accent">{t.games.accent}</span>
            </h2>
            <p>{t.games.p1}</p>
            <Link href="/register" className="lp-cta gw-cta">
              {t.games.cta}
            </Link>
          </div>
          <div className="gw-wall gw-wall-shots" dir="ltr">
            {WALL_COLUMNS.map((col, ci) => (
              <div key={ci} className={`gw-col ${ci % 2 ? "gw-down" : "gw-up"}`} style={{ ["--d" as string]: `${60 + ci * 10}s` }}>
                {/* Rendered twice for a seamless loop; the copy is hidden from assistive tech and has empty alts. */}
                {[0, 1].map((copy) => (
                  <ul key={copy} className="gw-list" aria-hidden={copy === 1 || undefined}>
                    {col.map((g) => (
                      <li key={g.file} className="gw-shot">
                        <Image
                          src={`/games/${g.file}.png`}
                          alt={copy === 0 ? `${g.name} — ${t.games.shotAlt}` : ""}
                          width={300}
                          height={180}
                          loading="lazy"
                        />
                        <span className="gw-shot-name">{g.name}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- supporting features ---------------- */}
      <section className="ft" aria-labelledby="features-title">
        <div className="container">
          <h2 className="wc-title" id="features-title">
            {t.features.before} <span className="lp-accent">{t.features.accent}</span>
          </h2>
          <span className="wc-chevron" aria-hidden />
          <p className="sec-intro">{t.features.intro}</p>
          <ul className="ft-grid">
            {t.features.items.map((f, i) => (
              <li key={f.title} className="ft-card" style={{ ["--tint" as string]: SUPPORT_FEATURE_STYLE[i]?.tint }}>
                <span className="ft-icon" aria-hidden>
                  <FeatureIcon name={SUPPORT_FEATURE_STYLE[i]?.icon ?? "phone"} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="hw" aria-labelledby="how-title">
        <div className="container">
          <h2 className="wc-title" id="how-title">
            {t.how.before} <span className="lp-accent">{t.how.accent}</span>
          </h2>
          <span className="wc-chevron" aria-hidden />
          <ol className="hw-steps">
            {t.how.steps.map((s, i) => (
              <li key={s.title}>
                <span className="hw-num" aria-hidden>
                  {i + 1}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- reviews ---------------- */}
      <section className="rv" aria-labelledby="reviews-title">
        <div className="container rv-head">
          <h2 className="wc-title" id="reviews-title">
            {t.reviews.before} <span className="lp-accent">{t.reviews.accent}</span>
          </h2>
          <span className="wc-chevron" aria-hidden />
          <p className="rv-stat">{t.reviews.stat}</p>
          <p className="sec-intro">{t.reviews.intro}</p>
        </div>
        <div className="rv-rows" dir="ltr">
          {REVIEW_ROWS.map((row, ri) => (
            <div key={ri} className={`rv-row ${ri % 2 ? "rv-right" : "rv-left"}`} style={{ ["--d" as string]: `${46 + ri * 8}s` }}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="rv-list" aria-hidden={copy === 1 || undefined}>
                  {row.map((r) => (
                    <li key={r.text} className={`rv-pill${r.hot ? " is-hot" : ""}`}>
                      {r.text}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- leaderboard ---------------- */}
      <section className="lb" aria-labelledby="regions-title">
        <div className="container">
          <div className="lb-head">
            <Laurel />
            <h2 id="regions-title">{t.board.title}</h2>
            <Laurel flip />
          </div>
          <div className="lb-trophy" aria-hidden>
            <Laurel big />
            <Trophy />
            <Laurel big flip />
          </div>
          <div className="lb-stage">
            <span className="lb-beams" aria-hidden />
            <p className="lb-sub">{t.board.sub}</p>
            <div className="lb-podium">
              <PodiumStep rank={4} tone="silver" countries={[{ code: "th", name: place(t, "Thailand") }]} />
              <PodiumStep rank={1} tone="gold" countries={TOP1.map((c) => ({ ...c, name: place(t, c.name) }))} crown />
              <PodiumStep rank={5} tone="bronze" countries={[{ code: "my", name: place(t, "Malaysia") }]} />
            </div>
            <ul className="lb-rest">
              {TOP_REST.map((r) => (
                <li key={r.code}>
                  <span className="lb-rank">TOP {r.rank}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="lb-flag" src={`https://flagcdn.com/w80/${r.code}.png`} alt={t.board.flag(place(t, r.name))} loading="lazy" width={40} height={27} />
                  <span>{place(t, r.name)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- any device ---------------- */}
      <section className="ad" aria-labelledby="devices-title">
        <div className="ad-bg" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ ["--h" as string]: [200, 28, 140, 260, 340, 90][i % 6] }} />
          ))}
        </div>
        <div className="container ad-inner">
          <h2 className="wc-title" id="devices-title">
            {t.devices.before && `${t.devices.before} `}
            <span className="lp-accent">{t.devices.accent}</span>
          </h2>
          <span className="wc-chevron" aria-hidden />
          <p className="ad-sub">{t.devices.sub}</p>
          <div className="ad-actions">
            <Link href="/register" className="lp-cta ad-cta">
              {t.devices.cta}
            </Link>
            <Link href="/pricing" className="vd-more-btn">
              {t.devices.plans}
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- faq ---------------- */}
      <section className="fq" id="faq" aria-labelledby="faq-title">
        <div className="container fq-inner">
          <h2 className="wc-title" id="faq-title">
            {t.faq.before} <span className="lp-accent">{t.faq.accent}</span>
          </h2>
          <div className="sp-faq">
            {t.faq.items.map((f) => (
              <details key={f.q}>
                <summary>
                  <h3>{f.q}</h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- local pieces (no shared components) */

const APP_COLORS = ["#1a73e8", "#34a853", "#7c4dff", "#1e88e5", "#fb8c00", "#455a64", "#00897b", "#d81b60"];
const DOCK_COLORS = ["#43a047", "#1e88e5", "#ffffff", "#fdd835"];

/** Simplified Android home screen used in the static mockups. */
function AndroidScreen({ dim }: { dim?: boolean }) {
  return (
    <div className={`ah${dim ? " is-dim" : ""}`}>
      <div className="ah-status">
        <span>09:41</span>
        <span className="ah-status-icons">
          <i className="ah-wifi" />
          <i className="ah-signal" />
          <i className="ah-battery" />
        </span>
      </div>
      <div className="ah-clock">
        <strong>09:41</strong>
        <span>Mon 20 Oct</span>
      </div>
      <div className="ah-search">
        <i />
      </div>
      <div className="ah-grid">
        {APP_COLORS.map((c) => (
          <span key={c} className="ah-app">
            <span className="ah-icon am-icon" style={{ ["--c" as string]: c }} />
          </span>
        ))}
      </div>
      <div className="ah-dock">
        {DOCK_COLORS.map((c) => (
          <span key={c} className="ah-icon am-icon" style={{ ["--c" as string]: c }} />
        ))}
      </div>
      <div className="ah-nav">
        <i />
      </div>
    </div>
  );
}

function SliderArrow({ dir, at, to }: { dir: "prev" | "next"; at: number; to: number | null }) {
  const cls = `dm-arrow dm-arrow-${dir} dm-at-${at}`;
  const icon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
  if (to === null) {
    return (
      <span className={`${cls} is-disabled`} aria-hidden>
        {icon}
      </span>
    );
  }
  return (
    <label htmlFor={`plans-pos-${to}`} className={cls} aria-hidden>
      {icon}
    </label>
  );
}

type FeatureIconName = "phone" | "sliders" | "download" | "folder" | "camera" | "mic";

function FeatureIcon({ name }: { name: FeatureIconName }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 24 24" {...p}>
      {name === "phone" && (
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
          <path d="M10.5 18.5h3" />
        </>
      )}
      {name === "sliders" && <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4" />}
      {name === "download" && <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />}
      {name === "folder" && <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 11v5M9.5 13.5 12 11l2.5 2.5" />}
      {name === "camera" && (
        <>
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <circle cx="12" cy="13.5" r="3.5" />
          <path d="M9 7l1.5-3h3L15 7" />
        </>
      )}
      {name === "mic" && (
        <>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </>
      )}
    </svg>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function PlatformIcon({ name }: { name: (typeof PLATFORMS)[number]["icon"] }) {
  switch (name) {
    case "globe":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
      );
    case "windows":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 5.5 10.5 4.4v7.1H3zM11.5 4.3 21 3v8.5h-9.5zM3 12.5h7.5v7.1L3 18.5zM11.5 12.5H21V21l-9.5-1.3z" />
        </svg>
      );
    case "apple":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.1 1.76-.96 2.8 1.01.08 2.05-.52 2.68-1.28z" />
        </svg>
      );
    case "android":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M6 10.5a6 6 0 0 1 12 0z" />
          <path d="M6 11.5h12V18a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18z" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
          <path d="M10.5 18.5h3" strokeLinecap="round" />
        </svg>
      );
  }
}

function PodiumStep({
  rank,
  tone,
  countries,
  crown,
}: {
  rank: number;
  tone: "gold" | "silver" | "bronze";
  countries: { code: string; name: string }[];
  crown?: boolean;
}) {
  return (
    <div className={`lb-step lb-${tone}`}>
      <ul className="lb-flags">
        {countries.map((c) => (
          <li key={c.code}>
            <span className="lb-flag-wrap">
              {crown && (
                <svg className="lb-crown" viewBox="0 0 24 16" aria-hidden>
                  <path d="M2 14 1 3l6 5 5-7 5 7 6-5-1 11z" fill="#fa003f" stroke="#161616" strokeWidth="1" />
                </svg>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="lb-flag lb-flag-round" src={`https://flagcdn.com/w80/${c.code}.png`} alt="" loading="lazy" width={46} height={46} />
            </span>
            <span className="lb-tag">{c.name}</span>
          </li>
        ))}
      </ul>
      <div className="lb-block">TOP {rank}</div>
    </div>
  );
}

function Laurel({ flip, big }: { flip?: boolean; big?: boolean }) {
  const leaves = Array.from({ length: big ? 7 : 5 }, (_, i) => i);
  return (
    <svg className={`lb-laurel${big ? " lb-laurel-big" : ""}`} viewBox="0 0 60 100" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <path d="M42 96C18 80 10 52 22 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {leaves.map((i) => {
        const t = i / (leaves.length - 1);
        const y = 88 - t * 76;
        const x = 36 - Math.sin(t * Math.PI * 0.9) * 16 - t * 6;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cx="-7" cy="-2" rx="8" ry="3.4" transform="rotate(-35)" fill="currentColor" />
            <ellipse cx="7" cy="-4" rx="8" ry="3.4" transform="rotate(-145)" fill="currentColor" opacity=".8" />
          </g>
        );
      })}
    </svg>
  );
}

function Trophy() {
  return (
    <svg className="lb-cup" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <linearGradient id="lb-gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ff8aa5" />
          <stop offset=".5" stopColor="#fa003f" />
          <stop offset="1" stopColor="#a00028" />
        </linearGradient>
      </defs>
      <path d="M30 22h60v8c0 26-12 42-30 44-18-2-30-18-30-44z" fill="url(#lb-gold)" />
      <path d="M30 30H18c0 16 8 24 18 26M90 30h12c0 16-8 24-18 26" fill="none" stroke="url(#lb-gold)" strokeWidth="6" strokeLinecap="round" />
      <rect x="54" y="74" width="12" height="14" fill="url(#lb-gold)" />
      <path d="M38 100c0-8 10-12 22-12s22 4 22 12z" fill="url(#lb-gold)" />
      <rect x="34" y="100" width="52" height="8" rx="3" fill="url(#lb-gold)" />
      <path d="M53 36l18 10-18 10z" fill="#161616" />
    </svg>
  );
}
