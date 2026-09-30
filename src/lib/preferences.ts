import "server-only";

import { cookies, headers } from "next/headers";

import type { HourCycle } from "./format";
import { LAST_PLACE_COOKIE } from "./place";
import { placeFromSearchParams } from "./place-params";
import type { Place, UnitSystem } from "./weather/types";

export const UNITS_COOKIE = "units";

/** Countries that use Fahrenheit day to day. */
const FAHRENHEIT_REGIONS = new Set([
  "US",
  "LR",
  "MM",
  "PR",
  "GU",
  "VI",
  "AS",
  "BS",
  "BZ",
  "KY",
  "PW",
  "FM",
  "MH",
]);

function primaryLocale(acceptLanguage: string | null): string {
  const tag = acceptLanguage?.split(",")[0]?.split(";")[0]?.trim();
  if (!tag || tag === "*") return "en-US";
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? "en-US";
  } catch {
    return "en-US";
  }
}

/**
 * "en-US" is the default browser language far outside the US, so the
 * request's country (set by Vercel) wins over the locale when present.
 */
function defaultUnits(locale: string, country: string | null): UnitSystem {
  const region = country ?? new Intl.Locale(locale).maximize().region;
  return region && FAHRENHEIT_REGIONS.has(region) ? "imperial" : "metric";
}

function hourCycleFor(locale: string): HourCycle {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h11" || cycle === "h12" ? "h12" : "h23";
}

export type Preferences = {
  units: UnitSystem;
  hourCycle: HourCycle;
};

/**
 * Read on the server so the first render already uses the right units and
 * clock. No flash of °C before a client effect swaps in °F.
 */
export async function getPreferences(): Promise<Preferences> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const locale = primaryLocale(headerList.get("accept-language"));
  const stored = cookieStore.get(UNITS_COOKIE)?.value;

  return {
    units:
      stored === "metric" || stored === "imperial"
        ? stored
        : defaultUnits(locale, headerList.get("x-vercel-ip-country")),
    hourCycle: hourCycleFor(locale),
  };
}

/**
 * The place to show when the URL names none: the last one viewed, then the
 * approximate location Vercel derives from the request IP. Locally neither
 * exists and the page shows the search prompt instead.
 */
export async function getDefaultPlace(): Promise<Place | null> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);

  const saved = cookieStore.get(LAST_PLACE_COOKIE)?.value;
  if (saved) {
    const place = placeFromSearchParams(new URLSearchParams(saved));
    if (place) return place;
  }

  const latitude = headerList.get("x-vercel-ip-latitude");
  const longitude = headerList.get("x-vercel-ip-longitude");
  if (!latitude || !longitude) return null;

  const city = headerList.get("x-vercel-ip-city");
  const country = headerList.get("x-vercel-ip-country");
  const params = new URLSearchParams({ lat: latitude, lon: longitude });
  if (city) params.set("name", decodeURIComponent(city));
  if (country) {
    const countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(country);
    if (countryName) params.set("region", countryName);
  }

  return placeFromSearchParams(params);
}
