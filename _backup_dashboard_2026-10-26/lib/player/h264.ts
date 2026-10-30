/** Minimal H.264 Annex B helpers. */

export function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.byteLength + b.byteLength);
  out.set(a, 0);
  out.set(b, a.byteLength);
  return out;
}

/** Returns NAL unit payloads (without start codes). */
export function splitNalUnits(buf: Uint8Array): Uint8Array[] {
  const units: Uint8Array[] = [];
  let i = 0;
  let start = -1;
  while (i + 3 <= buf.length) {
    const sc3 = buf[i] === 0 && buf[i + 1] === 0 && buf[i + 2] === 1;
    const sc4 = i + 4 <= buf.length && buf[i] === 0 && buf[i + 1] === 0 && buf[i + 2] === 0 && buf[i + 3] === 1;
    if (sc3 || sc4) {
      if (start >= 0) units.push(buf.subarray(start, i));
      i += sc4 ? 4 : 3;
      start = i;
    } else i++;
  }
  if (start >= 0 && start < buf.length) units.push(buf.subarray(start));
  return units;
}

/** Build a WebCodecs codec string ("avc1.PPCCLL") from the SPS in a config packet. */
export function codecStringFromConfig(config: Uint8Array): string | null {
  for (const nal of splitNalUnits(config)) {
    if (nal.length >= 4 && (nal[0]! & 0x1f) === 7) {
      const hex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
      return `avc1.${hex(nal[1]!)}${hex(nal[2]!)}${hex(nal[3]!)}`;
    }
  }
  return null;
}
