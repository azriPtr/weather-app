import "server-only";

import { cache } from "react";

import type { AirQuality, Coordinates, Forecast, Place } from "../types";
import {
  FORECAST_FIELDS,
  airQualityResponseSchema,
  forecastResponseSchema,
  geocodingResponseSchema,
  toAirQuality,
  toForecast,
  toPlaces,
} from "./schema";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Open-Meteo refreshes current conditions every 15 minutes. */
const FORECAST_TTL = 10 * 60;
const PLACES_TTL = 24 * 60 * 60;
const TIMEOUT_MS = 8_000;

async function request(endpoint: string, params: Record<string, string>, revalidate: number) {
  const url = `${endpoint}?${new URLSearchParams(params)}`;
  const response = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo ${new URL(endpoint).hostname} responded with ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

function coordinateParams({ latitude, longitude }: Coordinates) {
  return { latitude: String(latitude), longitude: String(longitude) };
}

// `cache` dedupes calls within one render (metadata + page). The timeout signal
// opts fetch out of Next's automatic memoization, so it is needed here.
export const getForecast = cache(async (coordinates: Coordinates): Promise<Forecast> => {
  const json = await request(
    FORECAST_URL,
    {
      ...coordinateParams(coordinates),
      current: FORECAST_FIELDS.current.join(","),
      hourly: FORECAST_FIELDS.hourly.join(","),
      daily: FORECAST_FIELDS.daily.join(","),
      timezone: "auto",
      timeformat: "unixtime",
      forecast_days: "10",
      forecast_hours: "25",
    },
    FORECAST_TTL,
  );

  return toForecast(forecastResponseSchema.parse(json));
});

/** Air quality is a nice-to-have: failures resolve to `null` instead of failing the page. */
export const getAirQuality = cache(async (coordinates: Coordinates): Promise<AirQuality | null> => {
  try {
    const json = await request(
      AIR_QUALITY_URL,
      { ...coordinateParams(coordinates), current: "us_aqi,pm2_5" },
      FORECAST_TTL,
    );
    return toAirQuality(airQualityResponseSchema.parse(json));
  } catch {
    return null;
  }
});

export async function searchPlaces(query: string): Promise<Place[]> {
  const json = await request(
    GEOCODING_URL,
    { name: query, count: "12", language: "en", format: "json" },
    PLACES_TTL,
  );

  return toPlaces(geocodingResponseSchema.parse(json));
}
