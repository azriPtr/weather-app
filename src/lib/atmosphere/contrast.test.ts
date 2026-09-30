import { describe, expect, it } from "vitest";

import { deriveScene, getPhase, type Phase, type Scene } from "./scene";

// Mirrors src/app/globals.css.
const TEXT_MUTED = 0.88; // --color-fg-muted, used for secondary text on the sky
const TEXT_SUBTLE = 0.8; // --color-fg-subtle, the faintest text on panels
const CLOUD_PEAK = 0.42; // centre stop of .atmosphere-cloud
const HAZE_PEAK = 0.7; // bottom stop of .atmosphere-haze
const GLOW_REACH = 0.5; // share of the sun glow left where text sits
const WCAG_AA = 4.5;

type Rgb = [number, number, number];

/** OKLCH to gamma-encoded sRGB. https://bottosson.github.io/posts/oklab/ */
function toSrgb(l: number, c: number, h: number): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const encode = (linear: number) => {
    const value = Math.min(Math.max(linear, 0), 1);
    return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
  };
  return [
    encode(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    encode(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    encode(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  ];
}

function parse(css: string): { rgb: Rgb; alpha: number } {
  const match = css.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
  if (!match) throw new Error(`Unexpected color ${css}`);
  return {
    rgb: toSrgb(Number(match[1]) / 100, Number(match[2]), Number(match[3])),
    alpha: match[4] ? Number(match[4]) : 1,
  };
}

/** Browsers composite in gamma-encoded sRGB. */
const over = (base: Rgb, top: Rgb, alpha: number): Rgb =>
  base.map((value, i) => value * (1 - alpha) + top[i] * alpha) as Rgb;

function luminance(rgb: Rgb): number {
  const linear = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function whiteTextContrast(background: Rgb, alpha: number): number {
  const text = over(background, [1, 1, 1], alpha);
  const [a, b] = [luminance(text), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** The brightest backdrop text can land on: a cloud's centre, plus haze or sun glow. */
function worstSky(scene: Scene, edge: "top" | "bottom"): Rgb {
  const sky = parse(edge === "top" ? scene.skyTop : scene.skyBottom).rgb;
  const cloud = parse(scene.cloudColor).rgb;
  let rgb = over(sky, cloud, scene.cloudOpacity * CLOUD_PEAK);
  if (edge === "bottom") rgb = over(rgb, cloud, scene.hazeOpacity * HAZE_PEAK);
  // The sun sits above the page by day and on the horizon at dawn and dusk.
  const glowAtBottom = Number.parseFloat(scene.glowY) > 50;
  if (glowAtBottom === (edge === "bottom")) {
    const glow = parse(scene.glowColor);
    rgb = over(rgb, glow.rgb, glow.alpha * GLOW_REACH);
  }
  return rgb;
}

const SUNRISE = 1_790_000_000;
const SUNSET = SUNRISE + 12 * 3600;
const MOMENTS: Record<Phase, number> = {
  dawn: SUNRISE,
  day: SUNRISE + 6 * 3600,
  dusk: SUNSET,
  night: SUNSET + 4 * 3600,
};
const CODES = [0, 2, 3, 45, 53, 63, 71, 95];

export const scenes = CODES.flatMap((weatherCode) =>
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

export function measure(scene: Scene) {
  const glass = parse(scene.glass);
  return {
    skyText: whiteTextContrast(worstSky(scene, "top"), TEXT_MUTED),
    panelTop: whiteTextContrast(over(worstSky(scene, "top"), glass.rgb, glass.alpha), TEXT_SUBTLE),
    panelBottom: whiteTextContrast(
      over(worstSky(scene, "bottom"), glass.rgb, glass.alpha),
      TEXT_SUBTLE,
    ),
  };
}

describe("text contrast on every sky, with clouds, haze and sun glow behind it", () => {
  it.each(scenes)("$name: secondary text on the sky", ({ scene }) => {
    expect(measure(scene).skyText).toBeGreaterThanOrEqual(WCAG_AA);
  });

  it.each(scenes)("$name: faintest text on a glass panel", ({ scene }) => {
    const { panelTop, panelBottom } = measure(scene);
    expect(Math.min(panelTop, panelBottom)).toBeGreaterThanOrEqual(WCAG_AA);
  });
});
