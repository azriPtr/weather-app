"use client";

import { History, LoaderCircle, MapPin, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { placeKey } from "@/lib/place";
import { useRecentPlaces } from "@/lib/recent-places";
import type { Place } from "@/lib/weather/types";

import { usePlaceNavigation } from "../navigation/place-navigation";

type Entry = { status: "success"; places: Place[] } | { status: "error" };

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 180;

/** While a query loads, show results for the longest prefix already fetched. */
function staleResults(entries: Record<string, Entry>, key: string): Place[] | undefined {
  for (let length = key.length - 1; length >= MIN_QUERY_LENGTH; length--) {
    const entry = entries[key.slice(0, length)];
    if (entry?.status === "success" && entry.places.length > 0) return entry.places;
  }
  return undefined;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query) : -1;
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-fg">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  );
}

/**
 * City search following the WAI-ARIA combobox pattern: focus stays in the
 * input, arrow keys move the active option, Enter picks, Escape closes.
 */
export function PlaceSearch({
  size = "default",
  autoFocus = false,
  shortcut = false,
  currentPlaceKey,
}: {
  size?: "default" | "large";
  autoFocus?: boolean;
  /** Focus the input with "/" or ⌘K. */
  shortcut?: boolean;
  /** Hidden from recents, since it's already on screen. */
  currentPlaceKey?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [active, setActive] = useState({ list: "", index: -1 });
  const recents = useRecentPlaces();
  const { navigate } = usePlaceNavigation();

  const key = query.trim().toLowerCase();
  const searching = key.length >= MIN_QUERY_LENGTH;
  const entry = searching ? entries[key] : undefined;
  const status = !searching ? "idle" : entry ? entry.status : "loading";

  const recentOptions = recents.filter((place) => placeKey(place) !== currentPlaceKey);
  const results =
    entry?.status === "success"
      ? entry.places
      : status === "loading"
        ? (staleResults(entries, key) ?? [])
        : [];
  const options = searching ? results : recentOptions;
  const listName = searching ? key : "recent";
  const activeIndex =
    active.list === listName
      ? Math.min(active.index, options.length - 1)
      : searching && options.length > 0
        ? 0
        : -1;
  const expanded = open && (searching || recentOptions.length > 0);

  useEffect(() => {
    if (!searching || entries[key]) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(key)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Search responded with ${response.status}`);
        const { places } = (await response.json()) as { places: Place[] };
        setEntries((previous) => ({ ...previous, [key]: { status: "success", places } }));
      } catch {
        if (controller.signal.aborted) return;
        setEntries((previous) => ({ ...previous, [key]: { status: "error" } }));
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searching, key, entries]);

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.closest("input, textarea, select, [contenteditable='true']");
      const slash = event.key === "/" && !isTyping;
      const commandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (!slash && !commandK) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  const select = (place: Place) => {
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    navigate(place);
  };

  const retry = () =>
    setEntries((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setOpen(true);
        if (options.length > 0) {
          setActive({ list: listName, index: (activeIndex + 1) % options.length });
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (options.length > 0) {
          setActive({
            list: listName,
            index: activeIndex <= 0 ? options.length - 1 : activeIndex - 1,
          });
        }
        break;
      case "Enter": {
        const option = options[activeIndex];
        if (expanded && option) {
          event.preventDefault();
          select(option);
        }
        break;
      }
      case "Escape":
        if (expanded) {
          event.preventDefault();
          setOpen(false);
        } else if (query) {
          setQuery("");
        }
        break;
    }
  };

  const optionId = (index: number) => `${listboxId}-${index}`;
  const large = size === "large";

  const announcement =
    status === "loading"
      ? "Searching"
      : status === "error"
        ? "Search failed"
        : status === "success"
          ? results.length === 0
            ? "No places found"
            : `${results.length} ${results.length === 1 ? "place" : "places"} found`
          : "";

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          aria-hidden
          strokeWidth={1.75}
          className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-fg-subtle ${large ? "left-5 size-5" : "left-4 size-4"}`}
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search for a city"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          placeholder="Search for a city"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          // Search is the only action on the landing view.
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={`w-full rounded-full border border-line bg-panel text-fg backdrop-blur-xl transition-[background-color,border-color] duration-200 outline-none placeholder:text-fg-subtle hover:border-white/20 focus:border-white/35 focus:bg-panel-strong ${
            large
              ? "h-14 pr-14 pl-13 text-lg"
              : `h-11 pl-10.5 text-[15px] ${query ? "pr-11" : "pr-3 sm:pr-11"}`
          }`}
        />
        <div className="absolute inset-y-0 right-1.5 z-10 flex items-center">
          {status === "loading" ? (
            <LoaderCircle aria-hidden className="mr-2.5 size-4 animate-spin text-fg-subtle" />
          ) : query ? (
            <button
              type="button"
              aria-label="Clear search"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="grid size-8 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-white/10 hover:text-fg"
            >
              <X aria-hidden className="size-4" />
            </button>
          ) : shortcut ? (
            <kbd className="mr-2 hidden h-6 min-w-6 place-items-center rounded-md border border-line px-1.5 font-sans text-xs text-fg-subtle sm:grid">
              /
            </kbd>
          ) : null}
        </div>
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-panel-strong p-1.5 shadow-2xl shadow-black/30 backdrop-blur-2xl motion-safe:animate-[dropdown_140ms_var(--ease-out-strong)]"
      >
        {!searching && <p className="px-3 pt-2 pb-1.5 label">Recent</p>}

        <ul
          id={listboxId}
          role="listbox"
          aria-label={searching ? "Matching places" : "Recent places"}
          className={`transition-opacity duration-150 ${status === "loading" ? "opacity-50" : ""}`}
        >
          {options.map((place, index) => (
            <li
              key={`${placeKey(place)}-${place.name}`}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(place)}
              onMouseMove={() => {
                if (index !== activeIndex) setActive({ list: listName, index });
              }}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 aria-selected:bg-white/10"
            >
              {searching ? (
                <MapPin aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-fg-subtle" />
              ) : (
                <History
                  aria-hidden
                  strokeWidth={1.75}
                  className="size-4 shrink-0 text-fg-subtle"
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-fg-muted">
                  <Highlight text={place.name} query={searching ? key : ""} />
                </span>
                {place.region && (
                  <span className="block truncate text-sm text-fg-subtle">{place.region}</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {status === "loading" && options.length === 0 && (
          <p className="px-3 py-3 text-sm text-fg-muted">Searching…</p>
        )}
        {status === "success" && options.length === 0 && (
          <div className="px-3 py-3 text-sm">
            <p className="text-fg">No places match “{query.trim()}”.</p>
            <p className="mt-0.5 text-fg-subtle">
              Check the spelling, or try a larger city nearby.
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center justify-between gap-4 px-3 py-3 text-sm">
            <p className="text-fg-muted">Search isn’t responding.</p>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={retry}
              className="shrink-0 font-medium text-fg underline-offset-4 hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
