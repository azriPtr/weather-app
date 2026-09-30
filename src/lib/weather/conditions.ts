export type ConditionKind =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing-rain"
  | "snow"
  | "thunderstorm";

/** 0 = none, 3 = heavy. Drives precipitation density in the atmosphere. */
export type Intensity = 0 | 1 | 2 | 3;

export type Condition = {
  code: number;
  kind: ConditionKind;
  label: string;
  intensity: Intensity;
  showers: boolean;
};

type Definition = {
  kind: ConditionKind;
  label: string;
  nightLabel?: string;
  intensity?: Intensity;
  showers?: boolean;
};

// WMO 4677 weather interpretation codes, as used by Open-Meteo.
// https://open-meteo.com/en/docs#weather_variable_documentation
const DEFINITIONS: Record<number, Definition> = {
  0: { kind: "clear", label: "Sunny", nightLabel: "Clear" },
  1: { kind: "clear", label: "Mostly sunny", nightLabel: "Mostly clear" },
  2: { kind: "partly-cloudy", label: "Partly cloudy" },
  3: { kind: "cloudy", label: "Cloudy" },
  45: { kind: "fog", label: "Fog" },
  48: { kind: "fog", label: "Freezing fog" },
  51: { kind: "drizzle", label: "Light drizzle", intensity: 1 },
  53: { kind: "drizzle", label: "Drizzle", intensity: 2 },
  55: { kind: "drizzle", label: "Heavy drizzle", intensity: 3 },
  56: { kind: "freezing-rain", label: "Freezing drizzle", intensity: 1 },
  57: { kind: "freezing-rain", label: "Heavy freezing drizzle", intensity: 2 },
  61: { kind: "rain", label: "Light rain", intensity: 1 },
  63: { kind: "rain", label: "Rain", intensity: 2 },
  65: { kind: "rain", label: "Heavy rain", intensity: 3 },
  66: { kind: "freezing-rain", label: "Freezing rain", intensity: 2 },
  67: { kind: "freezing-rain", label: "Heavy freezing rain", intensity: 3 },
  71: { kind: "snow", label: "Light snow", intensity: 1 },
  73: { kind: "snow", label: "Snow", intensity: 2 },
  75: { kind: "snow", label: "Heavy snow", intensity: 3 },
  77: { kind: "snow", label: "Snow grains", intensity: 1 },
  80: { kind: "rain", label: "Light showers", intensity: 1, showers: true },
  81: { kind: "rain", label: "Showers", intensity: 2, showers: true },
  82: { kind: "rain", label: "Heavy showers", intensity: 3, showers: true },
  85: { kind: "snow", label: "Snow showers", intensity: 2, showers: true },
  86: { kind: "snow", label: "Heavy snow showers", intensity: 3, showers: true },
  95: { kind: "thunderstorm", label: "Thunderstorms", intensity: 2 },
  96: { kind: "thunderstorm", label: "Thunderstorms with hail", intensity: 3 },
  99: { kind: "thunderstorm", label: "Severe thunderstorms", intensity: 3 },
};

const UNKNOWN: Definition = { kind: "cloudy", label: "Unknown conditions" };

export function describeCondition(code: number, isDay = true): Condition {
  const definition = DEFINITIONS[code] ?? UNKNOWN;

  return {
    code,
    kind: definition.kind,
    label: !isDay && definition.nightLabel ? definition.nightLabel : definition.label,
    intensity: definition.intensity ?? 0,
    showers: definition.showers ?? false,
  };
}

const WET_KINDS: ReadonlySet<ConditionKind> = new Set([
  "drizzle",
  "rain",
  "freezing-rain",
  "snow",
  "thunderstorm",
]);

export function isPrecipitation(kind: ConditionKind): boolean {
  return WET_KINDS.has(kind);
}
