import { css, mix, type Oklch } from "../color";
import { describeCondition, type ConditionKind } from "../weather/conditions";

export type Phase = "night" | "dawn" | "day" | "dusk";

export type PrecipitationType = "none" | "rain" | "snow";

/** Everything the background needs, as serialisable values. */
export type Scene = {
  phase: Phase;
  skyTop: string;
  skyBottom: string;
  glowColor: string;
  glowX: string;
  glowY: string;
  cloudColor: string;
  cloudOpacity: number;
  starOpacity: number;
  hazeOpacity: number;
  /** Tint of the glass panels: dark enough by day for contrast, light at night for body. */
  glass: string;
  precipitation: PrecipitationType;
  /** 0 to 1. */
  intensity: number;
  /** Horizontal drift of falling particles, -1 (westward) to 1 (eastward). */
  lean: number;
};

export type SceneInput = {
  weatherCode: number;
  isDay: boolean;
  cloudCover: number | null;
  windSpeed: number;
  windDirection: number;
  now: number;
  sunrise: number | null;
  sunset: number | null;
};

const TWILIGHT_SECONDS = 45 * 60;

export function getPhase({
  now,
  sunrise,
  sunset,
  isDay,
}: Pick<SceneInput, "now" | "sunrise" | "sunset" | "isDay">): Phase {
  if (sunrise != null && Math.abs(now - sunrise) <= TWILIGHT_SECONDS) return "dawn";
  if (sunset != null && Math.abs(now - sunset) <= TWILIGHT_SECONDS) return "dusk";
  return isDay ? "day" : "night";
}

type Gradient = { top: Oklch; bottom: Oklch };

// Tuned with src/lib/atmosphere/contrast.test.ts: white text must hold 4.5:1
// on every sky, including under clouds, haze and sun glow.
const CLEAR: Record<Phase, Gradient> = {
  night: { top: [0.19, 0.045, 268], bottom: [0.29, 0.06, 276] },
  dawn: { top: [0.34, 0.08, 285], bottom: [0.52, 0.11, 42] },
  day: { top: [0.45, 0.125, 254], bottom: [0.52, 0.11, 238] },
  dusk: { top: [0.28, 0.09, 290], bottom: [0.49, 0.13, 34] },
};

const OVERCAST: Record<Phase, Gradient> = {
  night: { top: [0.21, 0.015, 260], bottom: [0.28, 0.02, 262] },
  dawn: { top: [0.35, 0.03, 290], bottom: [0.45, 0.05, 45] },
  day: { top: [0.41, 0.025, 245], bottom: [0.47, 0.02, 240] },
  dusk: { top: [0.29, 0.035, 295], bottom: [0.41, 0.06, 35] },
};

const STORM: Record<Phase, Gradient> = {
  night: { top: [0.16, 0.02, 275], bottom: [0.22, 0.03, 280] },
  dawn: { top: [0.26, 0.03, 285], bottom: [0.36, 0.04, 40] },
  day: { top: [0.32, 0.03, 255], bottom: [0.41, 0.03, 250] },
  dusk: { top: [0.24, 0.035, 290], bottom: [0.34, 0.05, 35] },
};

type Glow = { color: Oklch; alpha: number; x: number; y: number };

const GLOW: Record<Phase, Glow> = {
  night: { color: [0.92, 0.02, 250], alpha: 0.14, x: 80, y: 6 },
  dawn: { color: [0.8, 0.12, 55], alpha: 0.4, x: 18, y: 108 },
  day: { color: [0.94, 0.07, 90], alpha: 0.3, x: 84, y: -8 },
  dusk: { color: [0.74, 0.14, 45], alpha: 0.42, x: 82, y: 108 },
};

const CLOUD: Record<Phase, Oklch> = {
  night: [0.42, 0.02, 265],
  dawn: [0.64, 0.04, 40],
  day: [0.65, 0.015, 245],
  dusk: [0.56, 0.05, 30],
};

const STORM_CLOUD: Oklch = [0.3, 0.02, 260];

const SMOKE: Oklch = [0.2, 0.02, 260];
const FROST: Oklch = [1, 0, 0];

const GLASS: Record<Phase, { color: Oklch; alpha: number }> = {
  night: { color: FROST, alpha: 0.07 },
  dawn: { color: SMOKE, alpha: 0.2 },
  day: { color: SMOKE, alpha: 0.24 },
  dusk: { color: SMOKE, alpha: 0.2 },
};

type Profile = {
  overcast: number;
  clouds: number;
  haze: number;
  storm?: boolean;
  precipitation?: Exclude<PrecipitationType, "none">;
};

const PROFILES: Record<ConditionKind, Profile> = {
  clear: { overcast: 0, clouds: 0.1, haze: 0 },
  "partly-cloudy": { overcast: 0.3, clouds: 0.5, haze: 0 },
  cloudy: { overcast: 0.8, clouds: 0.75, haze: 0.05 },
  fog: { overcast: 0.9, clouds: 0.3, haze: 0.5 },
  drizzle: { overcast: 0.8, clouds: 0.65, haze: 0.15, precipitation: "rain" },
  rain: { overcast: 0.9, clouds: 0.75, haze: 0.15, precipitation: "rain" },
  "freezing-rain": { overcast: 0.9, clouds: 0.75, haze: 0.2, precipitation: "rain" },
  snow: { overcast: 0.75, clouds: 0.65, haze: 0.2, precipitation: "snow" },
  thunderstorm: { overcast: 1, clouds: 0.85, haze: 0.1, storm: true, precipitation: "rain" },
};

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export function deriveScene(input: SceneInput): Scene {
  const condition = describeCondition(input.weatherCode, input.isDay);
  const profile = PROFILES[condition.kind];
  const phase = getPhase(input);

  // Cloud cover nudges clear and partly cloudy skies toward grey.
  const overcast = clamp(Math.max(profile.overcast, ((input.cloudCover ?? 0) / 100) * 0.6));

  const clear = CLEAR[phase];
  const grey = OVERCAST[phase];
  const sky = profile.storm
    ? STORM[phase]
    : { top: mix(clear.top, grey.top, overcast), bottom: mix(clear.bottom, grey.bottom, overcast) };

  const glow = GLOW[phase];
  const stars =
    phase === "night" ? clamp(0.9 - overcast * 1.3) : phase === "day" ? 0 : clamp(0.3 - overcast);

  const drizzleScale = condition.kind === "drizzle" ? 0.55 : 1;
  const intensity = profile.precipitation
    ? clamp((Math.max(condition.intensity, 1) / 3) * drizzleScale)
    : 0;

  // Meteorological direction is where the wind comes from, so negate it to get
  // where particles travel. East is to the right.
  const towardEast = -Math.sin((input.windDirection * Math.PI) / 180);
  const lean = clamp(input.windSpeed / 40) * 0.6 * towardEast;

  return {
    phase,
    skyTop: css(sky.top),
    skyBottom: css(sky.bottom),
    glowColor: css(glow.color, glow.alpha * (1 - overcast * 0.75)),
    glowX: `${glow.x}%`,
    glowY: `${glow.y}%`,
    cloudColor: css(profile.storm ? STORM_CLOUD : CLOUD[phase]),
    cloudOpacity: profile.clouds,
    starOpacity: stars,
    hazeOpacity: profile.haze,
    glass: css(GLASS[phase].color, GLASS[phase].alpha),
    precipitation: profile.precipitation ?? "none",
    intensity,
    lean: Number(lean.toFixed(3)),
  };
}

/** Shown before a place is chosen: a clear, early-night sky. */
export const DEFAULT_SCENE: Scene = {
  phase: "night",
  skyTop: css(CLEAR.night.top),
  skyBottom: css(mix(CLEAR.night.bottom, CLEAR.dusk.bottom, 0.25)),
  glowColor: css(GLOW.night.color, GLOW.night.alpha),
  glowX: `${GLOW.night.x}%`,
  glowY: `${GLOW.night.y}%`,
  cloudColor: css(CLOUD.night),
  cloudOpacity: 0.25,
  starOpacity: 0.8,
  hazeOpacity: 0,
  glass: css(GLASS.night.color, GLASS.night.alpha),
  precipitation: "none",
  intensity: 0,
  lean: 0,
};
