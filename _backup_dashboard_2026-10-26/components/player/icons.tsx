const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Icons = {
  back: () => (
    <svg {...base}><path d="M15 18l-6-6 6-6" /></svg>
  ),
  home: () => (
    <svg {...base}><circle cx="12" cy="12" r="7" /></svg>
  ),
  recents: () => (
    <svg {...base}><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
  ),
  volUp: () => (
    <svg {...base}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M17 9v6M14 12h6" /></svg>
  ),
  volDown: () => (
    <svg {...base}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 12h5" /></svg>
  ),
  power: () => (
    <svg {...base}><path d="M12 3v8" /><path d="M6.4 6.4a8 8 0 1 0 11.2 0" /></svg>
  ),
  rotate: () => (
    <svg {...base}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></svg>
  ),
  notifications: () => (
    <svg {...base}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
  ),
  fullscreen: () => (
    <svg {...base}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
  ),
  camera: () => (
    <svg {...base}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
  ),
  upload: () => (
    <svg {...base}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 20h16" /></svg>
  ),
  speaker: () => (
    <svg {...base}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>
  ),
  muted: () => (
    <svg {...base}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M17 9l5 5M22 9l-5 5" /></svg>
  ),
};
