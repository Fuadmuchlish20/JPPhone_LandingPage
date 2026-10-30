"use client";

import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import { deviceAction } from "@/app/dashboard/actions";
import { ApkUpload } from "./apk-upload";
import { Icons } from "./icons";
import { NavButtons } from "./nav-buttons";
import { QualitySelect } from "./quality-select";
import { useDeviceStream } from "./use-device-stream";

function LatencyBadge({ ms }: { ms: number | null }) {
  if (ms === null) return <span className="latency muted">— ms</span>;
  const cls = ms < 80 ? "good" : ms < 180 ? "ok" : "bad";
  return (
    <span className={`latency ${cls}`} title="Round-trip time to the device host">
      {ms} ms
    </span>
  );
}

export function DevicePlayer({ deviceId, name }: { deviceId: string; name: string }) {
  const { canvasRef, stageRef, view, send, setQuality, toggleMute, reconnect, fullscreen } = useDeviceStream(deviceId);
  const live = view.state === "live";
  const audioUsable = view.audio === "opus";

  return (
    <div className="player-page">
      <div className="player-bar">
        <Link href="/dashboard" className="btn btn-sm btn-ghost">
          ← Devices
        </Link>
        <strong>{name}</strong>
        <LatencyBadge ms={view.latency} />
        <span className="spacer" />
        <QualitySelect value={view.quality} onChange={setQuality} />
        <button
          type="button"
          className="btn btn-sm"
          onClick={toggleMute}
          disabled={!audioUsable}
          title={audioUsable ? (view.muted ? "Unmute" : "Mute") : `Audio ${view.audio ?? "pending"}`}
        >
          {view.muted || !audioUsable ? <Icons.muted /> : <Icons.speaker />}
        </button>
        <a
          className="btn btn-sm"
          href={`/api/devices/${deviceId}/screenshot`}
          download
          aria-disabled={!live}
          title="Screenshot"
          style={live ? undefined : { pointerEvents: "none", opacity: 0.5 }}
        >
          <Icons.camera />
        </a>
        <ApkUpload deviceId={deviceId} disabled={!live} />
        <ActionButton
          action={deviceAction.bind(null, deviceId, "restart")}
          label="Restart"
          confirm="Restart this device?"
        />
        <button type="button" className="btn btn-sm" onClick={fullscreen} title="Fullscreen">
          <Icons.fullscreen />
        </button>
      </div>

      <div className="player-body">
        <div ref={stageRef} className="player-stage" tabIndex={0} aria-label="Device screen. Click to control.">
          <canvas ref={canvasRef} className="player-canvas" />
          {!live && (
            <div className="player-overlay">
              <Overlay state={view.state} detail={view.detail} onRetry={reconnect} />
            </div>
          )}
        </div>
        <NavButtons send={send} disabled={!live} />
      </div>
    </div>
  );
}

function Overlay({ state, detail, onRetry }: { state: string; detail?: string; onRetry: () => void }) {
  const copy: Record<string, { title: string; body?: string; action?: string }> = {
    connecting: { title: "Connecting to your device…" },
    reconnecting: { title: "Reconnecting…", body: detail },
    replaced: { title: "Opened elsewhere", body: detail, action: "Use here" },
    unavailable: { title: "Device is not running", body: "Waiting for it to start… You can start it from the dashboard." },
    failed: { title: "Could not connect", body: detail, action: "Retry" },
    closed: { title: "Stream paused", body: "Paused while the tab was hidden.", action: "Resume" },
  };
  const c = copy[state] ?? { title: state };
  return (
    <div className="card stack">
      <strong>{c.title}</strong>
      {c.body && (
        <span className="muted" style={{ fontSize: 13 }}>
          {c.body}
        </span>
      )}
      {c.action && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          {c.action}
        </button>
      )}
    </div>
  );
}
