import { css, mix, type Oklch } from "../color";

// Anchored to absolute °C, so 30° is the same orange in every city.
const STOPS: ReadonlyArray<readonly [celsius: number, color: Oklch]> = [
  [-20, [0.7, 0.12, 275]],
  [-8, [0.76, 0.11, 245]],
  [4, [0.82, 0.09, 210]],
  [14, [0.86, 0.1, 165]],
  [21, [0.88, 0.12, 115]],
  [27, [0.84, 0.14, 80]],
  [33, [0.76, 0.16, 52]],
  [42, [0.66, 0.19, 28]],
];

export function temperatureColor(celsius: number): string {
  const first = STOPS[0];
  const last = STOPS[STOPS.length - 1];
  if (celsius <= first[0]) return css(first[1]);
  if (celsius >= last[0]) return css(last[1]);

  const upper = STOPS.findIndex(([stop]) => stop >= celsius);
  const [fromTemp, from] = STOPS[upper - 1];
  const [toTemp, to] = STOPS[upper];
  return css(mix(from, to, (celsius - fromTemp) / (toTemp - fromTemp)));
}

/** A left-to-right gradient covering `min` to `max`. */
export function temperatureGradient(min: number, max: number, steps = 6): string {
  const colors = Array.from({ length: steps }, (_, i) => {
    const celsius = min + ((max - min) * i) / (steps - 1);
    return `${temperatureColor(celsius)} ${((i / (steps - 1)) * 100).toFixed(1)}%`;
  });
  return `linear-gradient(90deg, ${colors.join(", ")})`;
}

export type RangeSegment = {
  /** Percent offsets of the segment inside the full track. */
  start: number;
  end: number;
};

/** Places one day's low-high span on a track that spans the whole week. */
export function rangeSegment(
  low: number,
  high: number,
  scaleMin: number,
  scaleMax: number,
): RangeSegment {
  const span = scaleMax - scaleMin || 1;
  const toPercent = (value: number) => ((value - scaleMin) / span) * 100;
  return { start: toPercent(low), end: toPercent(high) };
}
