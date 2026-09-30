import { CalendarDays } from "lucide-react";
import type { CSSProperties } from "react";

import type { Formatters } from "@/lib/format";
import { describeCondition } from "@/lib/weather/conditions";
import { rangeSegment, temperatureGradient } from "@/lib/weather/temperature-scale";
import type { Forecast } from "@/lib/weather/types";

import { Temperature } from "../units/values";
import { WeatherIcon } from "../weather-icon";

const SHOW_PROBABILITY_FROM = 20;
const MIN_SEGMENT = 4;

function RangeBar({
  low,
  high,
  scaleMin,
  scaleMax,
  gradient,
  marker,
}: {
  low: number;
  high: number;
  scaleMin: number;
  scaleMax: number;
  gradient: string;
  marker?: number;
}) {
  const segment = rangeSegment(low, high, scaleMin, scaleMax);
  const width = Math.max(segment.end - segment.start, MIN_SEGMENT);
  const left = Math.min(segment.start, 100 - width);
  // The gradient spans the whole week, so each day shows its own slice of it.
  const position = width >= 100 ? 0 : (left / (100 - width)) * 100;
  const markerAt =
    marker == null
      ? null
      : Math.min(Math.max(rangeSegment(marker, marker, scaleMin, scaleMax).start, 0), 100);

  return (
    <div aria-hidden className="relative h-1.5 rounded-full bg-white/12">
      <div
        className="absolute inset-y-0 rounded-full"
        style={{
          left: `${left}%`,
          width: `${width}%`,
          backgroundImage: gradient,
          backgroundSize: `${(100 / width) * 100}% 100%`,
          backgroundPosition: `${position}% 0`,
        }}
      />
      {markerAt != null && (
        <div
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_rgb(0_0_0/0.35)]"
          style={{ left: `${markerAt}%` }}
        />
      )}
    </div>
  );
}

export function DailyForecast({
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
  const { daily, current } = forecast;
  const scaleMin = Math.min(...daily.map((day) => day.temperatureMin));
  const scaleMax = Math.max(...daily.map((day) => day.temperatureMax));
  const gradient = temperatureGradient(scaleMin, scaleMax);

  return (
    <section
      aria-labelledby="daily-heading"
      className={`panel px-5 py-4 ${className ?? ""}`}
      style={style}
    >
      <h2 id="daily-heading" className="flex items-center gap-1.5 label">
        <CalendarDays aria-hidden className="size-3.5" strokeWidth={2} />
        {daily.length}-day forecast
      </h2>

      <ol className="mt-2">
        {daily.map((day, index) => {
          const condition = describeCondition(day.weatherCode);
          const probability = day.precipitationProbability;
          return (
            <li
              key={day.time}
              className="grid grid-cols-[3.25rem_2rem_2.5rem_minmax(0,1fr)_2.5rem] items-center gap-x-3 border-t border-line py-2.5 first:border-t-0"
            >
              <span className="font-medium">
                {index === 0 ? "Today" : format.weekday(day.time)}
              </span>
              <span className="flex flex-col items-center gap-0.5">
                <WeatherIcon code={day.weatherCode} className="size-5.5 text-fg-muted" />
                <span className="sr-only">{condition.label}</span>
                {probability != null && probability >= SHOW_PROBABILITY_FROM && (
                  <span className="text-[11px] leading-none font-medium text-rain tabular-nums">
                    {probability}%<span className="sr-only"> chance of precipitation</span>
                  </span>
                )}
              </span>
              <span className="text-right text-fg-subtle tabular-nums">
                <span className="sr-only">Low </span>
                <Temperature celsius={day.temperatureMin} />
              </span>
              <RangeBar
                low={day.temperatureMin}
                high={day.temperatureMax}
                scaleMin={scaleMin}
                scaleMax={scaleMax}
                gradient={gradient}
                marker={index === 0 ? current.temperature : undefined}
              />
              <span className="tabular-nums">
                <span className="sr-only">High </span>
                <Temperature celsius={day.temperatureMax} />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
