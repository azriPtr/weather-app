import type { UnitSystem } from "./types";

export type Measurement = {
  value: string;
  unit: string;
};

/** Math.round(-0.4) is -0, which would render as "-0°". */
function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function celsiusTo(system: UnitSystem, celsius: number): number {
  return system === "imperial" ? (celsius * 9) / 5 + 32 : celsius;
}

/** "23°". The scale is implied by the unit toggle, as in most weather apps. */
export function formatTemperature(celsius: number, system: UnitSystem): string {
  return `${round(celsiusTo(system, celsius))}°`;
}

export function formatSpeed(kmh: number, system: UnitSystem): Measurement {
  return system === "imperial"
    ? { value: String(round(kmh / 1.609344)), unit: "mph" }
    : { value: String(round(kmh)), unit: "km/h" };
}

export function formatPrecipitation(mm: number, system: UnitSystem): Measurement {
  if (system === "imperial") {
    const inches = mm / 25.4;
    return { value: inches > 0 && inches < 0.01 ? "<0.01" : String(round(inches, 2)), unit: "in" };
  }
  return { value: mm > 0 && mm < 0.1 ? "<0.1" : String(round(mm, mm < 10 ? 1 : 0)), unit: "mm" };
}

export function formatDistance(meters: number, system: UnitSystem): Measurement {
  const value = system === "imperial" ? meters / 1609.344 : meters / 1000;
  return {
    value: String(round(value, value < 10 ? 1 : 0)),
    unit: system === "imperial" ? "mi" : "km",
  };
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export function compassDirection(degrees: number): (typeof COMPASS)[number] {
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % COMPASS.length;
  return COMPASS[index];
}
