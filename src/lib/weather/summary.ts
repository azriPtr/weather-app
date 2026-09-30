import { describeCondition, isPrecipitation, type ConditionKind } from "./conditions";
import type { CurrentConditions, HourlyForecast } from "./types";

/**
 * A summary is plain text with temperature slots. Text is formatted on the
 * server; temperatures are filled in on the client so the unit toggle stays
 * instant.
 */
export type SummaryPart = string | { temperature: number };

type Formatter = { moment: (unix: number) => string };

const LOOKAHEAD_HOURS = 12;
const CHANCE = 30;
const LIKELY = 60;
const NOTICEABLE_CHANGE = 2;

function noun(kind: ConditionKind, temperature: number): string {
  switch (kind) {
    case "snow":
      return "Snow";
    case "thunderstorm":
      return "Thunderstorms";
    case "freezing-rain":
      return "Freezing rain";
    case "drizzle":
      return "Drizzle";
    case "rain":
      return "Rain";
    default:
      return temperature <= 0 ? "Snow" : "Rain";
  }
}

function isWet(hour: HourlyForecast): boolean {
  return (
    (hour.precipitationProbability ?? 0) >= CHANCE ||
    isPrecipitation(describeCondition(hour.weatherCode).kind)
  );
}

function precipitation(
  current: CurrentConditions,
  upcoming: HourlyForecast[],
  format: Formatter,
): SummaryPart[] {
  const now = describeCondition(current.weatherCode, current.isDay);

  if (isPrecipitation(now.kind)) {
    const label = noun(now.kind, current.temperature);
    const dryHour = upcoming.find((hour) => !isWet(hour));
    return dryHour
      ? [`${label} easing by ${format.moment(dryHour.time)}.`]
      : [`${label} continuing for the next ${LOOKAHEAD_HOURS} hours.`];
  }

  if (upcoming.every((hour) => hour.precipitationProbability == null)) return [];

  const start = upcoming.findIndex((hour) => (hour.precipitationProbability ?? 0) >= CHANCE);
  if (start === -1) return [`Dry for the next ${LOOKAHEAD_HOURS} hours.`];

  const first = upcoming[start];
  const peak = Math.max(...upcoming.slice(start).map((hour) => hour.precipitationProbability ?? 0));
  const label = noun(describeCondition(first.weatherCode).kind, first.temperature);
  const time = format.moment(first.time);

  return peak >= LIKELY
    ? [`${label} likely from ${time}.`]
    : [`Chance of ${label.toLowerCase()} from ${time}.`];
}

function temperature(
  current: CurrentConditions,
  upcoming: HourlyForecast[],
  format: Formatter,
): SummaryPart[] {
  if (upcoming.length === 0) return [];

  const warmest = upcoming.reduce((a, b) => (b.temperature > a.temperature ? b : a));
  const coolest = upcoming.reduce((a, b) => (b.temperature < a.temperature ? b : a));

  if (warmest.temperature - current.temperature >= NOTICEABLE_CHANGE) {
    return [
      "Warming to ",
      { temperature: warmest.temperature },
      ` by ${format.moment(warmest.time)}.`,
    ];
  }
  if (current.temperature - coolest.temperature >= NOTICEABLE_CHANGE) {
    return [
      "Cooling to ",
      { temperature: coolest.temperature },
      ` by ${format.moment(coolest.time)}.`,
    ];
  }
  return ["Holding near ", { temperature: current.temperature }, " for the next few hours."];
}

/**
 * One or two sentences that answer what people open a weather app for:
 * will it rain, and is it getting warmer or colder.
 * `hourly[0]` is the current hour, so the look-ahead starts at index 1.
 */
export function summarize(
  current: CurrentConditions,
  hourly: HourlyForecast[],
  format: Formatter,
): SummaryPart[] {
  const upcoming = hourly.slice(1, LOOKAHEAD_HOURS + 1);
  const sentences = [
    precipitation(current, upcoming, format),
    temperature(current, upcoming, format),
  ].filter((parts) => parts.length > 0);

  return sentences.flatMap((parts, index) => (index === 0 ? parts : [" ", ...parts]));
}
