import { useSyncExternalStore } from "react";

import { placeKey } from "./place";
import type { Place } from "./weather/types";

const STORAGE_KEY = "recent-places";
const LIMIT = 5;
const EMPTY: Place[] = [];

let snapshot: Place[] | null = null;
const listeners = new Set<() => void>();

function isPlace(value: unknown): value is Place {
  if (typeof value !== "object" || value === null) return false;
  const place = value as Record<string, unknown>;
  return (
    typeof place.name === "string" &&
    typeof place.latitude === "number" &&
    typeof place.longitude === "number" &&
    (typeof place.region === "string" || place.region === null)
  );
}

function read(): Place[] {
  if (snapshot) return snapshot;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    snapshot = Array.isArray(parsed) ? parsed.filter(isPlace).slice(0, LIMIT) : EMPTY;
  } catch {
    // Private mode or blocked storage: recents are a convenience, not state.
    snapshot = EMPTY;
  }
  return snapshot;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function addRecentPlace(place: Place) {
  const key = placeKey(place);
  const current = read();
  if (current[0] && placeKey(current[0]) === key && current[0].name === place.name) return;

  snapshot = [place, ...current.filter((item) => placeKey(item) !== key)].slice(0, LIMIT);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Keep the in-memory list even if it can't be persisted.
  }
  emit();
}

export function useRecentPlaces(): Place[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
