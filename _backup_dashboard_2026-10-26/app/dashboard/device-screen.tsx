"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live-ish thumbnail: pulls a fresh screenshot from the agent every `intervalMs` while the card is on screen.
 * Falls back to `children` until the first frame loads, or when screenshots fail.
 */
export function DeviceScreen({
  deviceId,
  live,
  intervalMs = 20_000,
  children,
}: {
  deviceId: string;
  live: boolean;
  intervalMs?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live || !visible || failed) return;
    const t = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(t);
  }, [live, visible, failed, intervalMs]);

  useEffect(() => {
    if (!live) {
      setLoaded(false);
      setFailed(false);
    }
  }, [live]);

  const showImg = live && visible && !failed;

  return (
    <div ref={ref} className="dd-screen-inner">
      {(!loaded || !showImg) && children}
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={tick}
          src={`/api/devices/${deviceId}/screenshot?t=${tick}`}
          alt=""
          className={loaded ? "is-loaded" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
