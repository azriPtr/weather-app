"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useTransition } from "react";

import { placeHref } from "@/lib/place";
import type { Place } from "@/lib/weather/types";

type PlaceNavigation = {
  navigate: (place: Place) => void;
  isPending: boolean;
};

const PlaceNavigationContext = createContext<PlaceNavigation | null>(null);

/**
 * Navigating inside a transition keeps the current forecast on screen until
 * the next one is ready, instead of flashing a skeleton for a ~200 ms fetch.
 */
export function PlaceNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (place: Place) => startTransition(() => router.push(placeHref(place))),
    [router],
  );

  const value = useMemo(() => ({ navigate, isPending }), [navigate, isPending]);
  return <PlaceNavigationContext value={value}>{children}</PlaceNavigationContext>;
}

export function usePlaceNavigation(): PlaceNavigation {
  const context = useContext(PlaceNavigationContext);
  if (!context) throw new Error("usePlaceNavigation must be used inside <PlaceNavigationProvider>");
  return context;
}

/** Dims its content while the next place loads. */
export function PendingRegion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isPending } = usePlaceNavigation();
  return (
    <div
      aria-busy={isPending}
      data-pending={isPending}
      className={`transition-[opacity,filter] duration-300 ease-out data-[pending=true]:opacity-55 data-[pending=true]:blur-[1px] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
