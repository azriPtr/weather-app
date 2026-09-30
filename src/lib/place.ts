import type { Place } from "./weather/types";

/**
 * Two decimals is about 1 km, finer than the weather models resolve. Rounding
 * keeps shared links from exposing someone's exact position and lets nearby
 * requests share a cache entry.
 */
const COORDINATE_DECIMALS = 2;

export const LAST_PLACE_COOKIE = "last_place";

export function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function placeToSearchParams(place: Place): URLSearchParams {
  const params = new URLSearchParams({
    lat: String(roundCoordinate(place.latitude)),
    lon: String(roundCoordinate(place.longitude)),
    name: place.name,
  });
  if (place.region) params.set("region", place.region);
  return params;
}

export function placeHref(place: Place): string {
  return `/?${placeToSearchParams(place)}`;
}

export function placeKey(place: Pick<Place, "latitude" | "longitude">): string {
  return `${roundCoordinate(place.latitude)},${roundCoordinate(place.longitude)}`;
}
