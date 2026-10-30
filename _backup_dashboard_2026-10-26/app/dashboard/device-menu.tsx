"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ActionButton, type ActionState } from "@/components/ui/action-button";
import type { DeviceRow } from "@/lib/db-types";
import { deviceAction, renameDeviceAction } from "./actions";
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  FolderUpIcon,
  GearIcon,
  GemIcon,
  ImageIcon,
  InstallIcon,
  PointerIcon,
  PowerIcon,
  RestartIcon,
  RootIcon,
  ShieldIcon,
  SwapIcon,
  TargetIcon,
} from "./icons";

// Shown in the grid to match the planned feature set; tapping explains they're not available yet.
const SOON: { label: string; icon: () => React.ReactElement }[] = [
  { label: "Authorization", icon: ShieldIcon },
  { label: "Customize", icon: PointerIcon },
  { label: "Replace", icon: SwapIcon },
  { label: "Gem", icon: GemIcon },
  { label: "Root", icon: RootIcon },
  { label: "Upload File", icon: FolderUpIcon },
  { label: "GPS changer", icon: TargetIcon },
];

function preciseLeft(expiresAt: string, now: number): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expired";
  const m = Math.floor(ms / 60_000);
  return `${Math.floor(m / 1440)}D ${Math.floor((m % 1440) / 60)}H ${m % 60}M`;
}

/** Gear button next to the device name; opens the device settings sheet. */
export function DeviceMenu({
  device,
  busy,
  now,
  planName,
  renewHref,
  readOnly,
}: {
  device: DeviceRow;
  busy: boolean;
  now: number;
  planName?: string;
  renewHref: string;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={trigger}
        className={`dm-menu-btn${open ? " is-open" : ""}`}
        onClick={() => setOpen(true)}
        aria-label={`Settings for ${device.name}`}
        aria-haspopup="dialog"
      >
        <GearIcon />
      </button>
      {open &&
        createPortal(
          <DeviceSheet
            device={device}
            busy={busy}
            now={now}
            planName={planName}
            renewHref={renewHref}
            readOnly={readOnly}
            onClose={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
          />,
          document.body,
        )}
    </>
  );
}

function DeviceSheet({
  device,
  busy,
  now,
  planName,
  renewHref,
  readOnly,
  onClose,
}: {
  device: DeviceRow;
  busy: boolean;
  now: number;
  planName?: string;
  renewHref: string;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const running = device.status === "running";
  const off = readOnly || busy;
  // Why a tile can't run right now (shown under the grid instead of disabling the tile).
  const blocked = (needsRunning: boolean): string | null =>
    readOnly
      ? "Preview mode: this runs on your real device."
      : busy
        ? "Please wait until the device finishes its current operation."
        : needsRunning && !running
          ? "Turn on the device first."
          : null;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function copyId() {
    navigator.clipboard?.writeText(device.id).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  }

  return (
    <div className="ds-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ds" role="dialog" aria-modal="true" aria-labelledby={`ds-title-${device.id}`}>
        <header className="ds-head">
          <span className="ds-avatar" aria-hidden>
            {(planName ?? device.name).charAt(0).toUpperCase()}
          </span>
          <div className="ds-meta">
            {renaming ? (
              <RenameForm device={device} readOnly={readOnly} onDone={() => setRenaming(false)} />
            ) : (
              <div className="ds-title-row">
                <h2 id={`ds-title-${device.id}`}>{device.name}</h2>
                <span className="ds-chip">{device.android_version}.0</span>
                {planName && <span className="ds-chip ds-chip-plan">{planName}</span>}
                <button className="ds-mini" onClick={() => setRenaming(true)} aria-label="Rename device" disabled={readOnly}>
                  <EditIcon />
                </button>
              </div>
            )}
            <p>
              Device ID: <code title={device.id}>{device.id.slice(0, 8).toUpperCase()}</code>
              <button className="ds-mini" onClick={copyId} aria-label="Copy device ID">
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </p>
            <p>
              Time left: <b className={new Date(device.expires_at).getTime() - now < 3 * 86_400_000 ? "dd-warn-text" : undefined}>{preciseLeft(device.expires_at, now)}</b>
            </p>
          </div>
          <button ref={closeRef} className="ds-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className="ds-grid">
          {SOON.slice(0, 5).map((t) => (
            <SoonTile key={t.label} {...t} onPick={(label) => setNote(`${label} isn't available yet.`)} />
          ))}
          {blocked(false) ? (
            <NoteTile icon={<PowerIcon />} label="Reboot" onPick={() => setNote(blocked(false))} />
          ) : (
            <ActionButton action={deviceAction.bind(null, device.id, "restart")} label="Reboot" icon={<Tile icon={<PowerIcon />} label="Reboot" />} className="ds-tile" />
          )}
          {blocked(false) ? (
            <NoteTile icon={<RestartIcon />} label="Reset" onPick={() => setNote(blocked(false))} />
          ) : (
            <ActionButton
              action={deviceAction.bind(null, device.id, "reset")}
              label="Reset"
              icon={<Tile icon={<RestartIcon />} label="Reset" />}
              className="ds-tile"
              confirm="Factory reset erases all apps and data on this device. Continue?"
            />
          )}
          {blocked(true) ? (
            <NoteTile icon={<ImageIcon />} label="Screenshot" onPick={() => setNote(blocked(true))} />
          ) : (
            <a className="ds-tile" href={`/api/devices/${device.id}/screenshot`} download>
              <Tile icon={<ImageIcon />} label="Screenshot" />
            </a>
          )}
          {blocked(true) ? (
            <NoteTile icon={<InstallIcon />} label="Install" onPick={() => setNote(blocked(true))} />
          ) : (
            <Link className="ds-tile" href={`/device/${device.id}`}>
              <Tile icon={<InstallIcon />} label="Install" />
            </Link>
          )}
          {SOON.slice(5).map((t) => (
            <SoonTile key={t.label} {...t} onPick={(label) => setNote(`${label} isn't available yet.`)} />
          ))}
        </div>
        {note && (
          <p className="ds-soon" role="status">
            {note}
          </p>
        )}

        <footer className="ds-foot">
          <Link href={renewHref} className="ds-btn">
            Renew
          </Link>
          {running ? (
            <Link href={readOnly ? "#" : `/device/${device.id}`} className="ds-btn ds-btn-primary" aria-disabled={readOnly}>
              Open cloud phone
            </Link>
          ) : (
            <ActionButton action={deviceAction.bind(null, device.id, "start")} label="Power on to use" className="ds-btn ds-btn-primary" disabled={off} />
          )}
        </footer>
      </div>
    </div>
  );
}

function SoonTile({ label, icon: Icon, onPick }: { label: string; icon: () => React.ReactElement; onPick: (label: string) => void }) {
  return (
    <button className="ds-tile" onClick={() => onPick(label)}>
      <Icon />
      <span>{label}</span>
    </button>
  );
}

/** Looks and clicks like an action tile, but only explains why the action can't run right now. */
function NoteTile({ icon, label, onPick }: { icon: React.ReactNode; label: string; onPick: () => void }) {
  return (
    <button className="ds-tile" onClick={onPick}>
      <Tile icon={icon} label={label} />
    </button>
  );
}

function Tile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <>
      {icon}
      <span>{label}</span>
    </>
  );
}

function RenameForm({ device, readOnly, onDone }: { device: DeviceRow; readOnly?: boolean; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(renameDeviceAction.bind(null, device.id), null);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="ds-rename">
      <input name="name" defaultValue={device.name} maxLength={40} required autoFocus aria-label="Device name" />
      <button className="ds-mini ds-mini-ok" disabled={pending || readOnly} aria-label="Save name">
        <CheckIcon />
      </button>
      <button type="button" className="ds-mini" onClick={onDone} aria-label="Cancel rename">
        <CloseIcon />
      </button>
      {state?.error && <span className="form-error">{state.error}</span>}
    </form>
  );
}
