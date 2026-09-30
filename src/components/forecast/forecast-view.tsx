import type { CSSProperties } from "react";

import { deriveScene } from "@/lib/atmosphere/scene";
import { createFormatters, type HourCycle } from "@/lib/format";
import { placeKey } from "@/lib/place";
import { getAirQuality, getForecast } from "@/lib/weather/open-meteo/client";
import type { Place } from "@/lib/weather/types";

import { Atmosphere } from "../atmosphere/atmosphere";
import { PendingRegion } from "../navigation/place-navigation";
import { AutoRefresh, RememberPlace } from "./client-effects";
import { CurrentConditions } from "./current-conditions";
import { DailyForecast } from "./daily-forecast";
import { Details } from "./details";
import { HourlyForecast } from "./hourly-forecast";

const order = (index: number) => ({ "--i": index }) as CSSProperties;

export async function ForecastView({ place, hourCycle }: { place: Place; hourCycle: HourCycle }) {
  const [forecast, airQuality] = await Promise.all([getForecast(place), getAirQuality(place)]);
  const format = createFormatters(forecast.timezone, hourCycle);
  const today = forecast.daily[0];

  const scene = deriveScene({
    weatherCode: forecast.current.weatherCode,
    isDay: forecast.current.isDay,
    cloudCover: forecast.current.cloudCover,
    windSpeed: forecast.current.windSpeed,
    windDirection: forecast.current.windDirection,
    now: forecast.current.time,
    sunrise: today?.sunrise ?? null,
    sunset: today?.sunset ?? null,
  });

  return (
    <>
      <Atmosphere scene={scene} />
      <RememberPlace place={place} />
      <AutoRefresh />

      {/* The sky stays outside: a filter on an ancestor would trap its fixed
          position. Keyed so a new place replays the entrance and resets scroll. */}
      <PendingRegion>
        <div
          key={placeKey(place)}
          className="grid grid-cols-[minmax(0,1fr)] gap-4 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-5"
        >
          <CurrentConditions
            place={place}
            forecast={forecast}
            format={format}
            hourCycle={hourCycle}
            className="stagger pb-4 lg:col-start-1 lg:row-start-1 lg:pb-6"
            style={order(0)}
          />
          <HourlyForecast
            forecast={forecast}
            format={format}
            className="stagger self-end lg:col-start-1 lg:row-start-2"
            style={order(1)}
          />
          <DailyForecast
            forecast={forecast}
            format={format}
            className="stagger lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
            style={order(2)}
          />
          <Details
            forecast={forecast}
            airQuality={airQuality}
            format={format}
            className="stagger lg:col-span-2"
            style={order(3)}
          />
        </div>
      </PendingRegion>
    </>
  );
}
