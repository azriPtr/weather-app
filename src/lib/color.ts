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

const OKLCH_PATTERN = /oklch\(([\d.]+)% ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/;

/**
 * sRGB for renderers without OKLCH support (the Open Graph image).
 * Only parses the format `css()` produces.
 */
export function toRgb(color: string): string {
  const match = color.match(OKLCH_PATTERN);
  if (!match) return color;

  const [l, c, h] = [Number(match[1]) / 100, Number(match[2]), Number(match[3])];
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const channel = (linear: number) => {
    const value = clamp01(linear);
    const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
    return Math.round(clamp01(encoded) * 255);
  };

  const rgb = [
    channel(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    channel(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    channel(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  ].join(", ");

  return match[4] ? `rgba(${rgb}, ${match[4]})` : `rgb(${rgb})`;
}
