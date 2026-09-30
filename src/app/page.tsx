import type { Metadata } from "next";
import { Suspense } from "react";

import { ForecastErrorBoundary } from "@/components/forecast/forecast-error-boundary";
import { ForecastSkeleton } from "@/components/forecast/forecast-skeleton";
import { ForecastView } from "@/components/forecast/forecast-view";
import { Landing } from "@/components/landing";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { placeKey, placeToSearchParams } from "@/lib/place";
import { placeFromSearchParams } from "@/lib/place-params";
import { getDefaultPlace, getPreferences } from "@/lib/preferences";
import { describeCondition } from "@/lib/weather/conditions";
import { getForecast } from "@/lib/weather/open-meteo/client";
import { formatTemperature } from "@/lib/weather/units";

async function resolvePlace(searchParams: PageProps<"/">["searchParams"]) {
  return placeFromSearchParams(await searchParams) ?? (await getDefaultPlace());
}

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const place = await resolvePlace(searchParams);
  if (!place) return {};

  const { units } = await getPreferences();
  const image = `/og?${placeToSearchParams(place)}${units === "imperial" ? "&units=imperial" : ""}`;
  const openGraph = { images: [{ url: image, width: 1200, height: 630 }] };

  try {
    const { current } = await getForecast(place);
    const condition = describeCondition(current.weatherCode, current.isDay);
    const title = `${place.name} ${formatTemperature(current.temperature, units)} ${condition.label}`;
    return { title, openGraph: { ...openGraph, title }, twitter: { card: "summary_large_image" } };
  } catch {
    return { title: place.name, openGraph };
  }
}

export default async function Page({ searchParams }: PageProps<"/">) {
  const [place, { hourCycle }] = await Promise.all([resolvePlace(searchParams), getPreferences()]);
  if (!place) return <Landing />;

  const key = placeKey(place);

  return (
    <>
      <SiteHeader currentPlaceKey={key} />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
        <ForecastErrorBoundary resetKey={key}>
          {/* Not keyed: during a place change the current forecast stays up
              (dimmed) until the next one streams in. */}
          <Suspense fallback={<ForecastSkeleton />}>
            <ForecastView place={place} hourCycle={hourCycle} />
          </Suspense>
        </ForecastErrorBoundary>
      </main>
      <SiteFooter />
    </>
  );
}
