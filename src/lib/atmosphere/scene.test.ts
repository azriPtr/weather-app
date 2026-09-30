import { describe, expect, it } from "vitest";

import { deriveScene, getPhase, type SceneInput } from "./scene";

const SUNRISE = 1_790_000_000;
const SUNSET = SUNRISE + 12 * 3600;

const base: SceneInput = {
  weatherCode: 0,
  isDay: true,
  cloudCover: 0,
  windSpeed: 0,
  windDirection: 0,
  now: SUNRISE + 6 * 3600,
  sunrise: SUNRISE,
  sunset: SUNSET,
};

describe("getPhase", () => {
  it("treats 45 minutes either side of sunrise and sunset as twilight", () => {
    expect(getPhase({ ...base, now: SUNRISE - 30 * 60, isDay: false })).toBe("dawn");
    expect(getPhase({ ...base, now: SUNSET + 40 * 60, isDay: false })).toBe("dusk");
    expect(getPhase({ ...base, now: SUNSET + 3 * 3600, isDay: false })).toBe("night");
    expect(getPhase(base)).toBe("day");
  });
});

describe("deriveScene", () => {
  it("shows stars on a clear night and hides them by day", () => {
    expect(
      deriveScene({ ...base, now: SUNSET + 3 * 3600, isDay: false }).starOpacity,
    ).toBeGreaterThan(0.5);
    expect(deriveScene(base).starOpacity).toBe(0);
  });

  it("maps precipitation codes to particles", () => {
    expect(deriveScene({ ...base, weatherCode: 65 })).toMatchObject({
      precipitation: "rain",
      intensity: 1,
    });
    expect(deriveScene({ ...base, weatherCode: 71 }).precipitation).toBe("snow");
    expect(deriveScene(base).precipitation).toBe("none");
  });

  it("keeps drizzle lighter than rain of the same intensity", () => {
    const drizzle = deriveScene({ ...base, weatherCode: 53 }).intensity;
    const rain = deriveScene({ ...base, weatherCode: 63 }).intensity;
    expect(drizzle).toBeLessThan(rain);
  });

  it("leans falling particles downwind", () => {
    // Wind from the west (270°) blows east, to the right.
    expect(deriveScene({ ...base, windSpeed: 40, windDirection: 270 }).lean).toBeGreaterThan(0);
    expect(deriveScene({ ...base, windSpeed: 40, windDirection: 90 }).lean).toBeLessThan(0);
  });
});
