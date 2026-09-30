import {
  Droplets,
  Eye,
  Leaf,
  Navigation2,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { formatDuration, type Formatters } from "@/lib/format";
import { describeCondition } from "@/lib/weather/conditions";
import { aqiLevel, uvLevel, visibilityNote } from "@/lib/weather/levels";
import type { AirQuality, CurrentConditions, Forecast } from "@/lib/weather/types";
import { compassDirection } from "@/lib/weather/units";

import { Distance, Precipitation, Speed, Temperature } from "../units/values";

const UV_SCALE =
  "linear-gradient(90deg, oklch(80% 0.15 145), oklch(88% 0.15 100), oklch(80% 0.16 62), oklch(68% 0.19 30), oklch(62% 0.2 330))";
const AQI_SCALE =
  "linear-gradient(90deg, oklch(80% 0.15 145), oklch(88% 0.15 100), oklch(78% 0.16 60), oklch(66% 0.2 28), oklch(55% 0.17 330), oklch(45% 0.12 15))";

function Card({
  icon: Icon,
  title,
  children,
  note,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  note?: ReactNode;
}) {
  return (
    <section className="flex min-h-44 flex-col panel p-4 sm:p-5">
      <h3 className="flex items-center gap-1.5 label">
        <Icon aria-hidden className="size-3.5" strokeWidth={2} />
        {title}
      </h3>
      <div className="mt-3">{children}</div>
      {note && (
        <p className="mt-auto pt-3 text-sm leading-snug text-pretty text-fg-muted">{note}</p>
      )}
    </section>
  );
}

function Value({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <>
      <p className="text-[2rem] leading-none font-light tracking-tight tabular-nums">{children}</p>
      {caption && <p className="mt-1.5 font-medium">{caption}</p>}
    </>
  );
}

const unit = "text-base font-normal tracking-normal text-fg-muted";

function ScaleBar({ gradient, position }: { gradient: string; position: number }) {
  return (
    <div
      aria-hidden
      className="relative mt-3 h-1 rounded-full"
      style={{ backgroundImage: gradient }}
    >
      <div
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_rgb(0_0_0/0.35)]"
        style={{ left: `${Math.min(Math.max(position, 0), 1) * 100}%` }}
      />
    </div>
  );
}

function uvNote({ current, hourly, daily }: Forecast, format: Formatters): string | null {
  const tomorrow = daily[1];
  const todayHours = hourly.filter((hour) => !tomorrow || hour.time < tomorrow.time);

  if ((current.uvIndex ?? 0) >= 3) {
    const lastHigh = todayHours.findLast((hour) => (hour.uvIndex ?? 0) >= 3);
    if (lastHigh) return `Use sun protection until ${format.moment(lastHigh.time + 3600)}.`;
  }

  const nextHigh = todayHours.slice(1).find((hour) => (hour.uvIndex ?? 0) >= 3);
  if (current.isDay && nextHigh)
    return `Sun protection needed from ${format.moment(nextHigh.time)}.`;

  if (tomorrow?.uvIndexMax != null) {
    const peak = Math.round(tomorrow.uvIndexMax);
    return `Tomorrow peaks at ${peak}, ${uvLevel(peak).label.toLowerCase()}.`;
  }
  return null;
}

function feelsLikeNote(current: CurrentConditions): string {
  const difference = current.feelsLike - current.temperature;
  if (difference >= 2) {
    return current.humidity >= 50
      ? "Humidity makes it feel warmer."
      : "Feels warmer than the actual temperature.";
  }
  if (difference <= -2) {
    return current.windSpeed >= 10
      ? "Wind makes it feel colder."
      : "Feels colder than the actual temperature.";
  }
  return "Close to the actual temperature.";
}

function nextWetDay({ daily }: Forecast, format: Formatters): string {
  const index = daily.findIndex(
    (day, i) => i > 0 && ((day.precipitationProbability ?? 0) >= 50 || day.precipitationSum >= 1),
  );
  if (index === -1) return `None expected in the next ${daily.length} days.`;

  const day = daily[index];
  const noun = describeCondition(day.weatherCode).kind === "snow" ? "snow" : "rain";
  const when = index === 1 ? "tomorrow" : format.weekdayLong(day.time);
  return `Next ${noun} likely ${when}.`;
}

function SunArc({ progress }: { progress: number | null }) {
  // Quadratic curve from sunrise (left) to sunset (right).
  const start = { x: 6, y: 44 };
  const control = { x: 60, y: -6 };
  const end = { x: 114, y: 44 };
  const t = progress ?? 0;
  const sun = {
    x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
    y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
  };
  const path = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;

  return (
    <svg viewBox="0 0 120 50" aria-hidden className="mt-3 w-full overflow-visible">
      <line x1="0" x2="120" y1="44" y2="44" stroke="white" strokeOpacity="0.2" />
      <path d={path} fill="none" stroke="white" strokeOpacity="0.3" strokeDasharray="2 3" />
      {progress != null && (
        <>
          <circle cx={sun.x} cy={sun.y} r="7" fill="oklch(95% 0.08 90)" opacity="0.25" />
          <circle cx={sun.x} cy={sun.y} r="3.5" fill="oklch(97% 0.06 95)" />
        </>
      )}
    </svg>
  );
}

function SunCard({ forecast, format }: { forecast: Forecast; format: Formatters }) {
  const [today, tomorrow] = forecast.daily;
  const now = forecast.current.time;
  const beforeSunrise = today?.sunrise != null && now < today.sunrise;
  const beforeSunset = today?.sunset != null && now < today.sunset;

  const next = beforeSunrise
    ? { kind: "Sunrise" as const, time: today.sunrise, other: "Sunset", otherTime: today.sunset }
    : beforeSunset
      ? {
          kind: "Sunset" as const,
          time: today.sunset,
          other: "Sunrise",
          otherTime: tomorrow?.sunrise ?? null,
        }
      : {
          kind: "Sunrise" as const,
          time: tomorrow?.sunrise ?? null,
          other: "Sunset",
          otherTime: tomorrow?.sunset ?? null,
        };

  const progress =
    !beforeSunrise && beforeSunset && today.sunrise != null && today.sunset != null
      ? (now - today.sunrise) / (today.sunset - today.sunrise)
      : null;
  const daylight = (beforeSunrise || beforeSunset ? today : tomorrow)?.daylightDuration;

  return (
    <Card
      icon={next.kind === "Sunrise" ? Sunrise : Sunset}
      title={next.kind}
      note={daylight != null ? `${formatDuration(daylight)} of daylight.` : undefined}
    >
      <Value>{next.time != null ? format.time(next.time) : "None"}</Value>
      {next.otherTime != null && (
        <p className="mt-1.5 text-sm text-fg-muted">
          {next.other} {format.time(next.otherTime)}
        </p>
      )}
      <SunArc progress={progress} />
    </Card>
  );
}

export function Details({
  forecast,
  airQuality,
  format,
  className,
  style,
}: {
  forecast: Forecast;
  airQuality: AirQuality | null;
  format: Formatters;
  className?: string;
  style?: CSSProperties;
}) {
  const { current, hourly } = forecast;
  const uv = current.uvIndex ?? 0;
  const uvReading = uvLevel(uv);
  const aqi = airQuality ? aqiLevel(airQuality.usAqi) : null;
  const next24h = hourly.slice(0, 24).reduce((total, hour) => total + hour.precipitation, 0);

  return (
    <section aria-label="Current details" className={className} style={style}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card icon={Sun} title="UV index" note={uvNote(forecast, format)}>
          <Value caption={uvReading.label}>{Math.round(uv)}</Value>
          <ScaleBar gradient={UV_SCALE} position={uvReading.position} />
        </Card>

        <Card
          icon={Leaf}
          title="Air quality"
          note={aqi ? aqi.advice : "No air quality data for this location."}
        >
          {airQuality && aqi ? (
            <>
              <Value caption={aqi.label}>{airQuality.usAqi}</Value>
              <ScaleBar gradient={AQI_SCALE} position={aqi.position} />
            </>
          ) : (
            <Value>–</Value>
          )}
        </Card>

        <Card
          icon={Wind}
          title="Wind"
          note={
            current.windGusts != null ? (
              <>
                Gusts up to <Speed kmh={current.windGusts} />.
              </>
            ) : undefined
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <Value caption={`From ${compassDirection(current.windDirection)}`}>
                <Speed kmh={current.windSpeed} unitClassName={unit} />
              </Value>
            </div>
            <div className="relative grid size-12 shrink-0 place-items-center rounded-full border border-line">
              <span className="absolute top-0.5 text-[9px] font-medium text-fg-subtle">N</span>
              {/* Points where the wind is going. */}
              <Navigation2
                aria-hidden
                className="size-4 fill-white/90 text-white/90"
                strokeWidth={1.5}
                style={{ transform: `rotate(${current.windDirection + 180}deg)` }}
              />
            </div>
          </div>
        </Card>

        <SunCard forecast={forecast} format={format} />

        <Card icon={Thermometer} title="Feels like" note={feelsLikeNote(current)}>
          <Value>
            <Temperature celsius={current.feelsLike} />
          </Value>
        </Card>

        <Card
          icon={Droplets}
          title="Humidity"
          note={
            current.dewPoint != null ? (
              <>
                The dew point is <Temperature celsius={current.dewPoint} /> right now.
              </>
            ) : undefined
          }
        >
          <Value>
            {Math.round(current.humidity)}
            <span className={unit}>%</span>
          </Value>
        </Card>

        <Card icon={Umbrella} title="Precipitation" note={nextWetDay(forecast, format)}>
          <Value caption="In the next 24 hours">
            <Precipitation mm={next24h} unitClassName={unit} />
          </Value>
        </Card>

        <Card
          icon={Eye}
          title="Visibility"
          note={
            current.visibility != null
              ? visibilityNote(current.visibility)
              : "No reading for this location."
          }
        >
          <Value>
            {current.visibility != null ? (
              <Distance meters={current.visibility} unitClassName={unit} />
            ) : (
              "–"
            )}
          </Value>
        </Card>
      </div>
    </section>
  );
}
