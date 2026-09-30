import { z } from "zod";

import { formatCoordinates } from "./format";
import { roundCoordinate } from "./place";
import type { Place } from "./weather/types";

const coordinate = (min: number, max: number) =>
  z.string().trim().min(1).transform(Number).pipe(z.number().min(min).max(max));

const label = (max: number) => z.string().trim().min(1).max(max).optional().catch(undefined);

const schema = z.object({
  lat: coordinate(-90, 90),
  lon: coordinate(-180, 180),
  name: label(80),
  region: label(120),
});

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The URL is the source of truth for the selected place, so any link can be
 * shared or refreshed. Invalid or partial params resolve to `null`.
 */
export function placeFromSearchParams(params: SearchParams | URLSearchParams): Place | null {
  const read = (key: string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    return (Array.isArray(value) ? value[0] : value) ?? undefined;
  };

  const result = schema.safeParse({
    lat: read("lat"),
    lon: read("lon"),
    name: read("name"),
    region: read("region"),
  });
  if (!result.success) return null;

  const latitude = roundCoordinate(result.data.lat);
  const longitude = roundCoordinate(result.data.lon);

  return {
    latitude,
    longitude,
    name: result.data.name ?? formatCoordinates(latitude, longitude),
    region: result.data.region ?? null,
  };
}
