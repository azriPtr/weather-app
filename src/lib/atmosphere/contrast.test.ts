import { describe, expect, it } from "vitest";

import { deriveScene, getPhase, type Phase } from "./scene";

// Mirrors the tokens in src/app/globals.css.
const PANEL = { color: [0.2, 0.02, 260] as const, alpha: 0.42 };
const SUBTLE_TEXT_ALPHA = 0.75;
const WCAG_AA = 4.5;

type Rgb = [number, number, number];

/** OKLCH to linear sRGB, clamped to gamut. https://bottosson.github.io/posts/oklab/ */
function toLinearRgb(l: number, c: number, h: number): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
  return [
    clamp(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    clamp(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    clamp(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  ];
}

function parse(css: string): Rgb {
  const match = css.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+)/);
  if (!match) throw new Error(`Unexpected color ${css}`);
  return toLinearRgb(Number(match[1]) / 100, Number(match[2]), Number(match[3]));
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const SUNRISE = 1_790_000_000;
const SUNSET = SUNRISE + 12 * 3600;
const MOMENTS: Record<Phase, number> = {
  dawn: SUNRISE,
  day: SUNRISE + 6 * 3600,
  dusk: SUNSET,
  night: SUNSET + 4 * 3600,
};
const CODES = [0, 2, 3, 45, 53, 63, 71, 95];

const scenes = CODES.flatMap((weatherCode) =>
  (Object.keys(MOMENTS) as Phase[]).map((phase) => {
    const now = MOMENTS[phase];
    const isDay = now > SUNRISE && now < SUNSET;
    expect(getPhase({ now, sunrise: SUNRISE, sunset: SUNSET, isDay })).toBe(phase);
    return {
      name: `code ${weatherCode} at ${phase}`,
      scene: deriveScene({
        weatherCode,
        isDay,
        cloudCover: 100,
        windSpeed: 0,
        windDirection: 0,
        now,
        sunrise: SUNRISE,
        sunset: SUNSET,
      }),
    };
  }),
);

describe("text contrast on every sky", () => {
  const panel = toLinearRgb(...PANEL.color);

  it.each(scenes)("$name: white headline on the sky", ({ scene }) => {
    expect(contrast(1, luminance(parse(scene.skyTop)))).toBeGreaterThanOrEqual(WCAG_AA);
  });

  it.each(scenes)("$name: secondary text on a panel", ({ scene }) => {
    // Worst case: a panel over the lightest part of the sky.
    const sky = parse(scene.skyBottom);
    const background = sky.map(
      (value, i) => value * (1 - PANEL.alpha) + panel[i] * PANEL.alpha,
    ) as Rgb;
    const text = SUBTLE_TEXT_ALPHA + (1 - SUBTLE_TEXT_ALPHA) * luminance(background);
    expect(contrast(text, luminance(background))).toBeGreaterThanOrEqual(WCAG_AA);
  });
});
