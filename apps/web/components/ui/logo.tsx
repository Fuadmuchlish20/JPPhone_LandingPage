/** JPPhone mark: two tilted phones linked by an S-shaped shared edge. Keep in sync with app/icon.svg. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="logo-mark">
      <g transform="rotate(-45 32 32)" fill="none" stroke="#fa003f" strokeWidth="5.5" strokeLinejoin="round">
        <path d="M26 10H17a5 5 0 0 0-5 5v20a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V29a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5h-9" />
        <circle cx="18.5" cy="33.5" r="2" fill="#fa003f" stroke="none" />
        <path d="M45.5 30.5v5" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <>
      <LogoMark />
      <span className="logo-word">
        JP<span>Phone</span>
      </span>
    </>
  );
}
