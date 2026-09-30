import { Clock, Sunrise, Sunset } from "lucide-react";
import type { CSSProperties } from "react";

import type { Formatters } from "@/lib/format";
import { describeCondition } from "@/lib/weather/conditions";
import type { Forecast } from "@/lib/weather/types";

import { Temperature } from "../units/values";
import { WeatherIcon } from "../weather-icon";
import { HourlyScroller } from "./hourly-scroller";

/** Below this, a rain chance is noise and stays hidden. */
const SHOW_PROBABILITY_FROM = 20;

type Item =
  | {
      kind: "hour";
      time: number;
      label: string;
      temperature: number;
      weatherCode: number;
      isDay: boolean;
      probability: number | null;
    }
  | { kind: "sunrise" | "sunset"; time: number; label: string };

function buildItems({ current, hourly, daily }: Forecast, format: Formatters): Item[] {
  const hours: Item[] = hourly.map((hour, index) =>
    index === 0
      ? {
          kind: "hour",
          time: hour.time,
          label: "Now",
          temperature: current.temperature,
          weatherCode: current.weatherCode,
          isDay: current.isDay,
          probability: hour.precipitationProbability,
        }
      : {
          kind: "hour",
          time: hour.time,
          label: format.hour(hour.time),
          temperature: hour.temperature,
          weatherCode: hour.weatherCode,
          isDay: hour.isDay,
          probability: hour.precipitationProbability,
        },
  );

  const end = hourly.at(-1)?.time ?? current.time;
  const sunEvents: Item[] = daily.slice(0, 2).flatMap((day) =>
    (["sunrise", "sunset"] as const).flatMap((kind) => {
      const time = day[kind];
      if (time == null || time <= current.time || time > end) return [];
      return { kind, time, label: format.time(time) };
    }),
  );

  return [...hours, ...sunEvents].toSorted((a, b) => a.time - b.time);
}

export function HourlyForecast({
  forecast,
  format,
  className,
  style,
}: {
  forecast: Forecast;
  format: Formatters;
  className?: string;
  style?: CSSProperties;
}) {
  const items = buildItems(forecast, format);
  const showsRain = (probability: number | null): probability is number =>
    probability != null && probability >= SHOW_PROBABILITY_FROM;
  // A dry day drops the empty rain row instead of leaving a gap in every column.
  const hasRainRow = items.some((item) => item.kind === "hour" && showsRain(item.probability));

  return (
    <section
      aria-labelledby="hourly-heading"
      className={`panel py-4 ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-baseline justify-between gap-4 px-5">
        <h2 id="hourly-heading" className="flex items-center gap-1.5 label">
          <Clock aria-hidden className="size-3.5" strokeWidth={2} />
          Next 24 hours
        </h2>
        <p className="text-xs text-fg-subtle">Updated {format.time(forecast.current.time)}</p>
      </div>

      <HourlyScroller label="Hourly forecast">
        <ol className="flex w-max px-3 pt-3">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.time}`}
              className="flex w-[4.25rem] shrink-0 flex-col items-center gap-2.5 py-1 text-center"
            >
              <span className="text-sm whitespace-nowrap text-fg-muted tabular-nums">
                {item.label}
              </span>
              {item.kind === "hour" ? (
                <>
                  <WeatherIcon code={item.weatherCode} isDay={item.isDay} className="size-6" />
                  <span className="sr-only">
                    {describeCondition(item.weatherCode, item.isDay).label}
                  </span>
                  {hasRainRow && (
                    <span className="h-4 text-xs font-medium text-rain tabular-nums">
                      {showsRain(item.probability) && (
                        <>
                          {item.probability}%
                          <span className="sr-only"> chance of precipitation</span>
                        </>
                      )}
                    </span>
                  )}
                  <span className="text-[17px] font-medium tabular-nums">
                    <Temperature celsius={item.temperature} />
                  </span>
                </>
              ) : (
                <>
                  {item.kind === "sunrise" ? (
                    <Sunrise aria-hidden className="size-6 text-fg-muted" strokeWidth={1.5} />
                  ) : (
                    <Sunset aria-hidden className="size-6 text-fg-muted" strokeWidth={1.5} />
                  )}
                  {hasRainRow && <span className="h-4" />}
                  <span className="text-sm font-medium text-fg-muted">
                    {item.kind === "sunrise" ? "Sunrise" : "Sunset"}
                  </span>
                </>
              )}
            </li>
          ))}
        </ol>
      </HourlyScroller>
    </section>
  );
}
