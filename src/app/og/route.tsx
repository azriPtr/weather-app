import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { site } from "@/config";
import { DEFAULT_SCENE, deriveScene, type Scene } from "@/lib/atmosphere/scene";
import { toRgb } from "@/lib/color";
import { placeFromSearchParams } from "@/lib/place-params";
import { describeCondition } from "@/lib/weather/conditions";
import { getForecast } from "@/lib/weather/open-meteo/client";
import type { Place } from "@/lib/weather/types";
import { formatTemperature } from "@/lib/weather/units";

const SIZE = { width: 1200, height: 630 };

/** Google Fonts serves TrueType to non-browser clients, which is what Satori reads. */
async function loadGeist(weight: number): Promise<ArrayBuffer> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Geist:wght@${weight}`, {
    cache: "force-cache",
  }).then((response) => response.text());
  const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error(`Geist ${weight} is unavailable`);
  return fetch(url, { cache: "force-cache" }).then((response) => response.arrayBuffer());
}

const fonts = Promise.all([loadGeist(200), loadGeist(500)]);

type Card = {
  scene: Scene;
  place?: Place;
  temperature?: string;
  details?: string;
};

function render({ scene, place, temperature, details }: Card) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "white",
        fontFamily: "Geist",
        backgroundImage: `radial-gradient(circle at ${scene.glowX} ${scene.glowY}, ${toRgb(scene.glowColor)}, transparent 60%), linear-gradient(180deg, ${toRgb(scene.skyTop)}, ${toRgb(scene.skyBottom)})`,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 500 }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24">
          <circle cx="12" cy="10" r="5" fill="white" />
          <rect x="3" y="14" width="18" height="2.5" rx="1.25" fill="white" fillOpacity="0.8" />
          <rect x="7" y="18.5" width="10" height="2.5" rx="1.25" fill="white" fillOpacity="0.5" />
        </svg>
        {site.name}
      </div>

      {place && temperature ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 500, letterSpacing: -1 }}>{place.name}</div>
          {place.region && (
            <div style={{ fontSize: 32, opacity: 0.84, marginTop: 6 }}>{place.region}</div>
          )}
          <div
            style={{
              fontSize: 230,
              fontWeight: 200,
              lineHeight: 1,
              letterSpacing: -12,
              marginTop: 20,
            }}
          >
            {temperature}
          </div>
          <div style={{ fontSize: 40, marginTop: 12, opacity: 0.92 }}>{details}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <div style={{ fontSize: 76, fontWeight: 500, letterSpacing: -2 }}>
            {place ? place.name : "Weather for any city"}
          </div>
          <div style={{ fontSize: 36, opacity: 0.84, marginTop: 16, lineHeight: 1.3 }}>
            Hourly for the next day, daily for the next 10, with UV and air quality.
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Open Graph image for a shared link: the place, its current temperature and
 * the same sky the page shows. Cached for as long as the forecast.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const place = placeFromSearchParams(params) ?? undefined;
  const units = params.get("units") === "imperial" ? "imperial" : "metric";
  const [light, medium] = await fonts;

  let card: Card = { scene: DEFAULT_SCENE, place };
  if (place) {
    try {
      const { current, daily } = await getForecast(place);
      const today = daily[0];
      const condition = describeCondition(current.weatherCode, current.isDay);
      card = {
        place,
        scene: deriveScene({
          weatherCode: current.weatherCode,
          isDay: current.isDay,
          cloudCover: current.cloudCover,
          windSpeed: current.windSpeed,
          windDirection: current.windDirection,
          now: current.time,
          sunrise: today?.sunrise ?? null,
          sunset: today?.sunset ?? null,
        }),
        temperature: formatTemperature(current.temperature, units),
        details: today
          ? `${condition.label} · H ${formatTemperature(today.temperatureMax, units)}  L ${formatTemperature(today.temperatureMin, units)}`
          : condition.label,
      };
    } catch {
      // Fall back to the branded card with the place name.
    }
  }

  return new ImageResponse(render(card), {
    ...SIZE,
    fonts: [
      { name: "Geist", data: light, weight: 200, style: "normal" },
      { name: "Geist", data: medium, weight: 500, style: "normal" },
    ],
    headers: {
      "Cache-Control": "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
