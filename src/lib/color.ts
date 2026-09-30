/** OKLCH as [lightness 0-1, chroma, hue in degrees]. */
export type Oklch = readonly [l: number, c: number, h: number];

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** Interpolates in OKLCH so mixes stay perceptually even (no muddy midpoints). */
export function mix(a: Oklch, b: Oklch, amount: number): Oklch {
  const t = clamp01(amount);
  const hueDelta = ((((b[2] - a[2]) % 360) + 540) % 360) - 180;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (a[2] + hueDelta * t + 360) % 360];
}

export function css([l, c, h]: Oklch, alpha = 1): string {
  const base = `${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)}`;
  return alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${clamp01(alpha).toFixed(3)})`;
}
