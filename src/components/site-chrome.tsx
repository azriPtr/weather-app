import Link from "next/link";

import { site } from "@/config";

import { LocateButton } from "./search/locate-button";
import { PlaceSearch } from "./search/place-search";
import { UnitToggle } from "./units/unit-toggle";

/** A sun setting behind two layers of stratus cloud. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <circle cx="12" cy="10" r="5" fill="currentColor" />
      <rect x="3" y="14" width="18" height="2.5" rx="1.25" fill="currentColor" opacity="0.8" />
      <rect x="7" y="18.5" width="10" height="2.5" rx="1.25" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function SiteHeader({
  search = true,
  currentPlaceKey,
}: {
  search?: boolean;
  currentPlaceKey?: string;
}) {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 pt-4 sm:gap-3 sm:px-6 sm:pt-6 lg:px-8">
      <Link
        href="/"
        className={`mr-auto items-center gap-2 rounded-full py-1 pr-2 text-[15px] font-medium tracking-tight text-fg ${search ? "hidden sm:flex" : "flex"}`}
      >
        <Logo className="size-5" />
        {site.name}
      </Link>
      {search && (
        <>
          <div className="min-w-0 flex-1 sm:w-80 sm:flex-none lg:w-96">
            <PlaceSearch shortcut currentPlaceKey={currentPlaceKey} />
          </div>
          <LocateButton />
        </>
      )}
      <UnitToggle />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-4 gap-y-1 px-4 pt-12 pb-8 text-sm text-fg-subtle sm:px-6 lg:px-8">
      <p>
        Weather data by{" "}
        <a
          href="https://open-meteo.com/"
          className="underline decoration-white/30 underline-offset-4 hover:text-fg"
        >
          Open-Meteo.com
        </a>{" "}
        (CC BY 4.0)
      </p>
      <a
        href={site.repository}
        className="underline decoration-white/30 underline-offset-4 hover:text-fg"
      >
        Source on GitHub
      </a>
    </footer>
  );
}
