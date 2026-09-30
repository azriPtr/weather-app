import { z } from "zod";

import type { AirQuality, DailyForecast, Forecast, HourlyForecast, Place } from "../types";

// Open-Meteo returns `null` inside series when a model has no value for that
// step, so every series is validated as nullable and cleaned up in the mapper.
const value = z.number();
const optional = z.number().nullable();
const series = z.array(optional);

export const forecastResponseSchema = z.object({
  timezone: z.string(),
  current: z.object({
    time: value,
    temperature_2m: value,
    apparent_temperature: value,
    relative_humidity_2m: value,
    dew_point_2m: optional,
    weather_code: value,
    is_day: value,
    cloud_cover: optional,
    precipitation: optional,
    pressure_msl: optional,
    wind_speed_10m: value,
    wind_direction_10m: value,
    wind_gusts_10m: optional,
    uv_index: optional,
    visibility: optional,
  }),
  hourly: z.object({
    time: z.array(value),
    temperature_2m: series,
    weather_code: series,
    is_day: series,
    precipitation_probability: series,
    precipitation: series,
    uv_index: series,
  }),
  daily: z.object({
    time: z.array(value),
    weather_code: series,
    temperature_2m_max: series,
    temperature_2m_min: series,
    precipitation_sum: series,
    precipitation_probability_max: series,
    sunrise: series,
    sunset: series,
    uv_index_max: series,
    daylight_duration: series,
  }),
});

export type ForecastResponse = z.infer<typeof forecastResponseSchema>;

/** Field lists derived from the schema, so the request and the parser never drift. */
export const FORECAST_FIELDS = {
  current: Object.keys(forecastResponseSchema.shape.current.shape).filter((key) => key !== "time"),
  hourly: Object.keys(forecastResponseSchema.shape.hourly.shape).filter((key) => key !== "time"),
  daily: Object.keys(forecastResponseSchema.shape.daily.shape).filter((key) => key !== "time"),
};

export function toForecast({ timezone, current, hourly, daily }: ForecastResponse): Forecast {
  const hours: HourlyForecast[] = hourly.time.flatMap((time, i) => {
    const temperature = hourly.temperature_2m[i];
    const weatherCode = hourly.weather_code[i];
    if (temperature == null || weatherCode == null) return [];

    return {
      time,
      temperature,
      weatherCode,
      isDay: hourly.is_day[i] === 1,
      precipitationProbability: hourly.precipitation_probability[i] ?? null,
      precipitation: hourly.precipitation[i] ?? 0,
      uvIndex: hourly.uv_index[i] ?? null,
    };
  });

  const days: DailyForecast[] = daily.time.flatMap((time, i) => {
    const temperatureMax = daily.temperature_2m_max[i];
    const temperatureMin = daily.temperature_2m_min[i];
    const weatherCode = daily.weather_code[i];
    if (temperatureMax == null || temperatureMin == null || weatherCode == null) return [];

    return {
      time,
      weatherCode,
      temperatureMax,
      temperatureMin,
      precipitationSum: daily.precipitation_sum[i] ?? 0,
      precipitationProbability: daily.precipitation_probability_max[i] ?? null,
      sunrise: daily.sunrise[i] ?? null,
      sunset: daily.sunset[i] ?? null,
      uvIndexMax: daily.uv_index_max[i] ?? null,
      daylightDuration: daily.daylight_duration[i] ?? null,
    };
  });

  return {
    timezone,
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      dewPoint: current.dew_point_2m,
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
      cloudCover: current.cloud_cover,
      precipitation: current.precipitation ?? 0,
      pressure: current.pressure_msl,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      windGusts: current.wind_gusts_10m,
      uvIndex: current.uv_index,
      visibility: current.visibility,
    },
    hourly: hours,
    daily: days,
  };
}

export const geocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        population: z.number().optional(),
      }),
    )
    .optional(),
});

export type GeocodingResponse = z.infer<typeof geocodingResponseSchema>;

/**
 * The geocoder matches prefixes, so "jakar" returns a town in Bhutan before
 * Jakarta. Ranking by population puts the place most people mean first.
 */
export function toPlaces({ results = [] }: GeocodingResponse, limit = 6): Place[] {
  const seen = new Set<string>();

  return results
    .toSorted((a, b) => (b.population ?? 0) - (a.population ?? 0))
    .flatMap((result) => {
      const region =
        [result.admin1, result.country]
          .filter((part): part is string => Boolean(part) && part !== result.name)
          .join(", ") || null;

      const key = `${result.name}|${region}`;
      if (seen.has(key)) return [];
      seen.add(key);

      return {
        name: result.name,
        region,
        latitude: result.latitude,
        longitude: result.longitude,
      };
    })
    .slice(0, limit);
}

export const airQualityResponseSchema = z.object({
  current: z.object({
    us_aqi: optional,
    pm2_5: optional,
  }),
});

export function toAirQuality({
  current,
}: z.infer<typeof airQualityResponseSchema>): AirQuality | null {
  if (current.us_aqi == null) return null;
  return { usAqi: Math.round(current.us_aqi), pm25: current.pm2_5 };
}
