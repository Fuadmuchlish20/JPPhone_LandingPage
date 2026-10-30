import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import type { DeviceRow } from "@/lib/db-types";
import { formatRam } from "@/lib/format";
import { deviceAction } from "./actions";
import { AndroidHome } from "./android-home";
import { DeviceMenu } from "./device-menu";
import { DeviceScreen } from "./device-screen";
import { PowerIcon } from "./icons";

export const TRANSITIONAL = new Set(["creating", "starting", "stopping"]);

const STATUS_LABEL: Record<string, string> = {
  running: "Running",
  stopped: "Powered off",
  creating: "Creating…",
  starting: "Booting…",
  stopping: "Shutting down…",
  error: "Error",
};

export function timeLeft(expiresAt: string, now: number): { label: string; days: number } {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return { label: "Expired", days: 0 };
  const days = ms / 86_400_000;
  if (days >= 1) return { label: `${Math.floor(days)}d left`, days };
  return { label: `${Math.max(1, Math.floor(ms / 3_600_000))}h left`, days };
}

type CardProps = {
  device: DeviceRow;
  now: number;
  renewHref: string;
  planName?: string;
  readOnly?: boolean;
};

const EXPIRING_DAYS = 3;

export function DeviceCard({ device, now, renewHref, planName, readOnly }: CardProps) {
  const s = device.status;
  const running = s === "running";
  const busy = TRANSITIONAL.has(s);
  const left = timeLeft(device.expires_at, now);

  return (
    <article className="dd-card">
      <div className="dd-screen">
        <span className={`dd-status dd-status-${s}`}>{STATUS_LABEL[s] ?? s}</span>

        <DeviceScreen deviceId={device.id} live={running && !readOnly}>
          <AndroidHome now={now} dim={!running} />
          {!running && (
            <div className={`dd-placeholder${busy ? " is-busy" : ""}`}>
              {busy ? <span className="dd-spinner" /> : <PowerIcon />}
              <span>{STATUS_LABEL[s]}</span>
            </div>
          )}
        </DeviceScreen>

        {left.days < EXPIRING_DAYS ? (
          <div className={`dd-expire${left.days <= 0 ? " is-expired" : ""}`}>
            <span>{left.days <= 0 ? "Plan expired" : `Expires in ${left.label.replace(" left", "")}`}</span>
            <Link href={renewHref} className="dd-renew">
              Renew
            </Link>
          </div>
        ) : (
          <span className="dd-left">{left.label}</span>
        )}

        <div className="dd-hover">
          {running ? (
            <Link href={`/device/${device.id}`} className="dd-enter">
              Enter
            </Link>
          ) : (
            !busy && (
              <ActionButton
                action={deviceAction.bind(null, device.id, "start")}
                label="Power on"
                className="dd-enter"
                disabled={readOnly}
              />
            )
          )}
        </div>
      </div>

      <div className="dd-info-row">
        <div className="dd-info">
          <strong title={device.name}>{device.name}</strong>
          <span>
            {Number(device.cpu)}C · {formatRam(device.ram_mb)} · {device.storage_gb}G · Android {device.android_version}
          </span>
        </div>
        <DeviceMenu device={device} busy={busy} now={now} planName={planName} renewHref={renewHref} readOnly={readOnly} />
      </div>
      {s === "error" && device.status_message && <p className="dd-error">{device.status_message}</p>}
    </article>
  );
}
