"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createFormatters, type HourCycle } from "@/lib/format";
import { LAST_PLACE_COOKIE, placeToSearchParams } from "@/lib/place";
import { addRecentPlace } from "@/lib/recent-places";
import type { Place } from "@/lib/weather/types";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Opening the app with no place in the URL returns to the last one viewed. */
export function RememberPlace({ place }: { place: Place }) {
  const { latitude, longitude, name, region } = place;

  useEffect(() => {
    const current = { latitude, longitude, name, region };
    const value = encodeURIComponent(placeToSearchParams(current).toString());
    document.cookie = `${LAST_PLACE_COOKIE}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    addRecentPlace(current);
  }, [latitude, longitude, name, region]);

  return null;
}

/**
 * Refreshes the forecast when a tab has been open or in the background long
 * enough for the data to go stale. Server data is cached for ten minutes.
 */
export function AutoRefresh({ intervalMs = 10 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let lastRefresh = Date.now();
    const refreshIfStale = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefresh < intervalMs) return;
      lastRefresh = Date.now();
      router.refresh();
    };

    const timer = window.setInterval(refreshIfStale, 60_000);
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, [router, intervalMs]);

  return null;
}

/** The place's local clock, ticking on the client after the server's first render. */
export function LocalTime({
  timeZone,
  hourCycle,
  initial,
}: {
  timeZone: string;
  hourCycle: HourCycle;
  initial: string;
}) {
  const [text, setText] = useState(initial);

  useEffect(() => {
    const format = createFormatters(timeZone, hourCycle);
    const timer = window.setInterval(() => setText(format.clock(Date.now() / 1000)), 10_000);
    return () => window.clearInterval(timer);
  }, [timeZone, hourCycle]);

  return <time suppressHydrationWarning>{text}</time>;
}
