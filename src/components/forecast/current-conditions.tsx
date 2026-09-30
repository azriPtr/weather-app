import type { CSSProperties } from "react";

import type { Formatters, HourCycle } from "@/lib/format";
import { describeCondition } from "@/lib/weather/conditions";
import { summarize } from "@/lib/weather/summary";
import type { Forecast, Place } from "@/lib/weather/types";

import { Temperature } from "../units/values";
import { WeatherIcon } from "../weather-icon";
import { LocalTime } from "./client-effects";

export function CurrentConditions({
  place,
  forecast,
  format,
  hourCycle,
  className,
  style,
}: {
  place: Place;
  forecast: Forecast;
  format: Formatters;
  hourCycle: HourCycle;
  className?: string;
  style?: CSSProperties;
}) {
  const { current, hourly, daily } = forecast;
  const today = daily[0];
  const condition = describeCondition(current.weatherCode, current.isDay);
  const summary = summarize(current, hourly, format);
  // Server Component: rendered once per request, so reading the clock is safe.
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now() / 1000;

  return (
    <section aria-labelledby="place-name" className={className} style={style}>
      <h1
        id="place-name"
        className="text-2xl font-medium tracking-tight text-balance sm:text-[2rem]"
      >
        {place.name}
      </h1>
      <p className="mt-1 text-[15px] text-fg-muted">
        {place.region && <>{place.region} · </>}
        <LocalTime
          timeZone={forecast.timezone}
          hourCycle={hourCycle}
          initial={format.clock(renderedAt)}
        />
      </p>

      <p className="mt-6 -ml-1 text-[clamp(6.5rem,20vw,10.5rem)] leading-[0.82] font-extralight tracking-[-0.06em] tabular-nums sm:mt-8">
        <Temperature celsius={current.temperature} />
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-lg">
        <span className="inline-flex items-center gap-2">
          <WeatherIcon code={current.weatherCode} isDay={current.isDay} className="size-5.5" />
          {condition.label}
        </span>
        {today && (
          <span className="text-fg-muted tabular-nums">
            H <Temperature celsius={today.temperatureMax} />
            <span className="px-1.5 text-fg-subtle">/</span>L{" "}
            <Temperature celsius={today.temperatureMin} />
          </span>
        )}
      </div>

      {summary.length > 0 && (
        <p className="mt-4 max-w-[36ch] text-lg leading-snug text-pretty text-fg-muted">
          {summary.map((part, index) =>
            typeof part === "string" ? (
              part
            ) : (
              <Temperature key={index} celsius={part.temperature} />
            ),
          )}
        </p>
      )}
    </section>
  );
}
