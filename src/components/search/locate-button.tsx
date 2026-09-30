"use client";

import { LoaderCircle, LocateFixed, X } from "lucide-react";
import { useEffect, useState } from "react";

import { roundCoordinate } from "@/lib/place";
import { reverseGeocode } from "@/lib/reverse-geocode";

import { usePlaceNavigation } from "../navigation/place-navigation";

type LocateState =
  { status: "idle" } | { status: "locating" } | { status: "error"; message: string };

const MESSAGES = {
  denied:
    "Location access is blocked for this site. Allow it in your browser settings, or search for a city.",
  unavailable: "Couldn’t get your location. Try again, or search for a city.",
  unsupported: "This browser can’t share its location. Search for a city instead.",
};

export function LocateButton({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const { navigate } = usePlaceNavigation();
  const [state, setState] = useState<LocateState>({ status: "idle" });
  const locating = state.status === "locating";

  useEffect(() => {
    if (state.status !== "error") return;
    const timer = window.setTimeout(() => setState({ status: "idle" }), 8_000);
    return () => window.clearTimeout(timer);
  }, [state]);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", message: MESSAGES.unsupported });
      return;
    }

    setState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        // Rounded before it leaves the browser: ~1 km is plenty for weather.
        const latitude = roundCoordinate(coords.latitude);
        const longitude = roundCoordinate(coords.longitude);
        const label = await reverseGeocode(latitude, longitude);
        setState({ status: "idle" });
        navigate({
          latitude,
          longitude,
          name: label?.name ?? "Current location",
          region: label?.region ?? null,
        });
      },
      (error) =>
        setState({
          status: "error",
          message: error.code === error.PERMISSION_DENIED ? MESSAGES.denied : MESSAGES.unavailable,
        }),
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  };

  const icon = locating ? (
    <LoaderCircle aria-hidden className="size-4.5 animate-spin" strokeWidth={1.75} />
  ) : (
    <LocateFixed aria-hidden className="size-4.5" strokeWidth={1.75} />
  );

  if (variant === "full") {
    return (
      <div>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex h-11 items-center gap-2.5 rounded-full border border-line bg-panel px-5 text-[15px] font-medium text-fg backdrop-blur-xl transition-[background-color,transform] duration-150 ease-out hover:bg-white/15 active:scale-[0.97] disabled:cursor-wait"
        >
          {icon}
          {locating ? "Finding you…" : "Use my location"}
        </button>
        {state.status === "error" && (
          <p role="alert" className="mt-3 max-w-md text-sm text-fg-muted">
            {state.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        aria-label="Use my location"
        title="Use my location"
        className="grid size-11 place-items-center rounded-full border border-line bg-panel text-fg-muted backdrop-blur-xl transition-[background-color,color,transform] duration-150 ease-out hover:bg-white/15 hover:text-fg active:scale-[0.95] disabled:cursor-wait"
      >
        {icon}
      </button>
      {state.status === "error" && (
        <div
          role="alert"
          className="absolute top-full right-0 z-50 mt-2 w-72 rounded-2xl border border-line bg-panel-strong p-3.5 pr-10 text-sm text-fg-muted shadow-2xl shadow-black/30 backdrop-blur-2xl"
        >
          {state.message}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setState({ status: "idle" })}
            className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full text-fg-subtle hover:bg-white/10 hover:text-fg"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
