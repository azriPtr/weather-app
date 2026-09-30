import Link from "next/link";

import { DEFAULT_SCENE } from "@/lib/atmosphere/scene";
import { placeHref } from "@/lib/place";
import type { Place } from "@/lib/weather/types";

import { Atmosphere } from "./atmosphere/atmosphere";
import { LocateButton } from "./search/locate-button";
import { PlaceSearch } from "./search/place-search";
import { SiteFooter, SiteHeader } from "./site-chrome";

// Spread across time zones, so at any hour some of them are in daylight.
const SUGGESTIONS: Place[] = [
  { name: "Tokyo", region: "Japan", latitude: 35.69, longitude: 139.69 },
  { name: "Jakarta", region: "Indonesia", latitude: -6.21, longitude: 106.85 },
  { name: "London", region: "England, United Kingdom", latitude: 51.51, longitude: -0.13 },
  { name: "Reykjavík", region: "Iceland", latitude: 64.15, longitude: -21.94 },
  { name: "New York", region: "New York, United States", latitude: 40.71, longitude: -74.01 },
];

/** Shown when the URL names no place and there is no saved or IP location. */
export function Landing() {
  return (
    <>
      <Atmosphere scene={DEFAULT_SCENE} />
      <SiteHeader search={false} />
      <main
        id="main"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 sm:px-6"
      >
        <h1 className="stagger text-4xl font-medium tracking-tight sm:text-5xl">
          Search for a city
        </h1>
        <p
          className="stagger mt-3 text-lg text-pretty text-fg-muted"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          Or use your location. Forecasts run hourly for the next day and daily for the next 10.
        </p>

        <div className="stagger relative z-10 mt-8" style={{ "--i": 2 } as React.CSSProperties}>
          <PlaceSearch size="large" autoFocus />
        </div>
        <div className="stagger mt-4" style={{ "--i": 3 } as React.CSSProperties}>
          <LocateButton variant="full" />
        </div>

        <div className="stagger mt-12" style={{ "--i": 4 } as React.CSSProperties}>
          <h2 className="label">Try a city</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((place) => (
              <li key={place.name}>
                <Link
                  href={placeHref(place)}
                  prefetch={false}
                  className="inline-flex h-10 items-center rounded-full border border-line bg-panel px-4 text-[15px] text-fg-muted backdrop-blur-xl transition-[background-color,color,transform] duration-150 ease-out hover:bg-white/15 hover:text-fg active:scale-[0.97]"
                >
                  {place.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
