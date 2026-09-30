export type UnitSystem = "metric" | "imperial";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Place = Coordinates & {
  name: string;
  /** Secondary label, e.g. "Jakarta, Indonesia". */
  region: string | null;
};

/**
 * All values are metric (°C, km/h, mm, m, hPa). Conversion happens at the
 * presentation layer so a unit switch never needs another network request.
 * Times are Unix seconds; the place's IANA time zone lives on `Forecast`.
 */
export type CurrentConditions = {
  time: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  dewPoint: number | null;
  weatherCode: number;
  isDay: boolean;
  cloudCover: number | null;
  precipitation: number;
  pressure: number | null;
  windSpeed: number;
  windDirection: number;
  windGusts: number | null;
  uvIndex: number | null;
  visibility: number | null;
};

export type HourlyForecast = {
  time: number;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  precipitationProbability: number | null;
  precipitation: number;
  uvIndex: number | null;
};

export type DailyForecast = {
  /** Local midnight of the day, as Unix seconds. */
  time: number;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  precipitationProbability: number | null;
  sunrise: number | null;
  sunset: number | null;
  uvIndexMax: number | null;
  daylightDuration: number | null;
};

export type Forecast = {
  timezone: string;
  current: CurrentConditions;
  /** Starts at the current hour, 25 entries. */
  hourly: HourlyForecast[];
  /** Starts today, 10 entries. */
  daily: DailyForecast[];
};

export type AirQuality = {
  usAqi: number;
  pm25: number | null;
};
