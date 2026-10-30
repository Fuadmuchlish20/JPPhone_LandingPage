"use client";

export interface Quality {
  bitRate: number;
  maxFps: number;
}

const BITRATES = [
  { v: 1_000_000, label: "1 Mbps" },
  { v: 2_000_000, label: "2 Mbps" },
  { v: 4_000_000, label: "4 Mbps" },
  { v: 8_000_000, label: "8 Mbps" },
];
const FPS = [15, 24, 30, 60];

export function QualitySelect({ value, onChange }: { value: Quality; onChange: (q: Quality) => void }) {
  return (
    <div className="row hide-sm" style={{ gap: 6 }}>
      <select
        className="input"
        style={{ width: "auto", padding: "5px 8px", fontSize: 13 }}
        value={value.bitRate}
        onChange={(e) => onChange({ ...value, bitRate: Number(e.target.value) })}
        aria-label="Bitrate"
      >
        {BITRATES.map((b) => (
          <option key={b.v} value={b.v}>
            {b.label}
          </option>
        ))}
      </select>
      <select
        className="input"
        style={{ width: "auto", padding: "5px 8px", fontSize: 13 }}
        value={value.maxFps}
        onChange={(e) => onChange({ ...value, maxFps: Number(e.target.value) })}
        aria-label="Frame rate"
      >
        {FPS.map((f) => (
          <option key={f} value={f}>
            {f} fps
          </option>
        ))}
      </select>
    </div>
  );
}
