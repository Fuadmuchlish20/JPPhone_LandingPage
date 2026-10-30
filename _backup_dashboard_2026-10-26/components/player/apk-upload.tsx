"use client";

import { useRef, useState } from "react";
import { Icons } from "./icons";

/** Uploads straight to the device host with a short-lived token (bypasses Vercel body limits). */
export function ApkUpload({ deviceId, disabled }: { deviceId: string; disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setMessage(null);
    setProgress(0);
    try {
      const res = await fetch(`/api/devices/${deviceId}/apk-token`, { method: "POST" });
      if (!res.ok) throw new Error("Could not authorize upload");
      const { token, uploadUrl } = (await res.json()) as { token: string; uploadUrl: string };

      const body = new FormData();
      body.append("apk", file, file.name);
      const result = await new Promise<{ ok: boolean; message?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.upload.onload = () => setProgress(100);
        xhr.onload = () => {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(body);
      });
      setMessage(result.ok ? `Installed ${file.name}` : (result.message ?? "Install failed"));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="row" style={{ gap: 8 }}>
      <input
        ref={input}
        type="file"
        accept=".apk,application/vnd.android.package-archive"
        hidden
        onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
      />
      <button
        type="button"
        className="btn btn-sm"
        disabled={disabled || progress !== null}
        onClick={() => input.current?.click()}
        title="Install APK"
      >
        <Icons.upload /> {progress !== null ? (progress < 100 ? `${progress}%` : "Installing…") : "APK"}
      </button>
      {progress !== null && progress < 100 && (
        <div className="progress" aria-hidden>
          <div style={{ width: `${progress}%` }} />
        </div>
      )}
      {message && (
        <span className="muted hide-sm" style={{ fontSize: 12, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
          {message}
        </span>
      )}
    </div>
  );
}
