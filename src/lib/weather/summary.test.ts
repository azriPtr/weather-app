import { describe, expect, it } from "vitest";

import { summarize, type SummaryPart } from "./summary";
import type { CurrentConditions, HourlyForecast } from "./types";

const HOUR = 3600;
const START = 1_790_000_000;

const format = { moment: (unix: number) => `T+${(unix - START) / HOUR}h` };

function current(overrides: Partial<CurrentConditions> = {}): CurrentConditions {
  return {
    time: START,
    temperature: 20,
    feelsLike: 20,
    humidity: 60,
    dewPoint: 12,
    weatherCode: 1,
    isDay: true,
    cloudCover: 20,
    precipitation: 0,
    pressure: 1012,
    windSpeed: 10,
    windDirection: 180,
    windGusts: 20,
    uvIndex: 4,
    visibility: 20_000,
    ...overrides,
  };
}

function hours(
  count: number,
  build: (index: number) => Partial<HourlyForecast> = () => ({}),
): HourlyForecast[] {
  return Array.from({ length: count }, (_, index) => ({
    time: START + index * HOUR,
    temperature: 20,
    weatherCode: 1,
    isDay: true,
    precipitationProbability: 0,
    precipitation: 0,
    uvIndex: 3,
    ...build(index),
  }));
}

/** Renders temperature slots as "<n>°" so assertions read like the UI. */
function text(parts: SummaryPart[]): string {
  return parts.map((part) => (typeof part === "string" ? part : `${part.temperature}°`)).join("");
}

describe("summarize", () => {
  it("says it stays dry when no hour reaches a 30% chance", () => {
    expect(text(summarize(current(), hours(25), format))).toBe(
      "Dry for the next 12 hours. Holding near 20° for the next few hours.",
    );
  });

  it("names the first wet hour and calls it likely above 60%", () => {
    const hourly = hours(25, (i) =>
      i >= 4 ? { precipitationProbability: 80, weatherCode: 63 } : {},
    );
    expect(text(summarize(current(), hourly, format))).toMatch(/^Rain likely from T\+4h\./);
  });

  it("calls a 30-59% peak a chance, in lower case", () => {
    const hourly = hours(25, (i) => (i === 6 ? { precipitationProbability: 40 } : {}));
    expect(text(summarize(current(), hourly, format))).toMatch(/^Chance of rain from T\+6h\./);
  });

  it("uses snow when the wet hour is below freezing and has no precipitation code", () => {
    const hourly = hours(25, (i) =>
      i === 2 ? { precipitationProbability: 70, temperature: -3 } : { temperature: -2 },
    );
    expect(text(summarize(current({ temperature: -2 }), hourly, format))).toMatch(
      /^Snow likely from T\+2h\./,
    );
  });

  it("says when ongoing rain eases", () => {
    const hourly = hours(25, (i) =>
      i < 3 ? { precipitationProbability: 90, weatherCode: 61 } : {},
    );
    const summary = text(summarize(current({ weatherCode: 61 }), hourly, format));
    expect(summary).toMatch(/^Rain easing by T\+3h\./);
  });

  it("reports the warmest upcoming hour when it is at least 2° warmer", () => {
    const hourly = hours(25, (i) => ({ temperature: 20 + Math.min(i, 5) }));
    expect(text(summarize(current(), hourly, format))).toContain("Warming to 25° by T+5h.");
  });

  it("reports the coolest upcoming hour when it is at least 2° cooler", () => {
    const hourly = hours(25, (i) => ({ temperature: 20 - Math.min(i, 8) }));
    expect(text(summarize(current(), hourly, format))).toContain("Cooling to 12° by T+8h.");
  });

  it("skips the rain sentence when the model has no probabilities", () => {
    const hourly = hours(25, () => ({ precipitationProbability: null }));
    expect(text(summarize(current(), hourly, format))).toBe(
      "Holding near 20° for the next few hours.",
    );
  });
});
