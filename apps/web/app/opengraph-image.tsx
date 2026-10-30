import { ImageResponse } from "next/og";

export const alt = "JPPhone — Android cloud phone for AFK & gaming";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card (Open Graph + Twitter), rendered at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #1f1f1f 0%, #0d0d0d 70%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="72" height="72" viewBox="0 0 64 64">
            <g transform="rotate(-45 32 32)" fill="none" stroke="#fa003f" strokeWidth="5.5" strokeLinejoin="round">
              <path d="M26 10H17a5 5 0 0 0-5 5v20a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V29a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5h-9" />
              <circle cx="18.5" cy="33.5" r="2" fill="#fa003f" stroke="none" />
              <path d="M45.5 30.5v5" strokeWidth="2.6" strokeLinecap="round" />
            </g>
          </svg>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
            JP<span style={{ color: "#fa003f" }}>Phone</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Android Cloud Phone</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            for&nbsp;<span style={{ color: "#ffffff", background: "#fa003f", padding: "0 14px", borderRadius: 10 }}>AFK &amp; Gaming</span>
          </div>
          <div style={{ fontSize: 30, color: "#d1d5db" }}>Run multiple games 24/7 in the cloud — from any browser.</div>
        </div>
      </div>
    ),
    size,
  );
}
