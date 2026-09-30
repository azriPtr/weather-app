import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import desktopChicago from "../../../docs/screenshots/desktop-chicago.jpg";
import desktopDubai from "../../../docs/screenshots/desktop-dubai.jpg";
import desktopJakarta from "../../../docs/screenshots/desktop-jakarta.jpg";
import desktopLanding from "../../../docs/screenshots/desktop-landing.jpg";
import desktopSearch from "../../../docs/screenshots/desktop-search.jpg";
import mobileChicago from "../../../docs/screenshots/mobile-chicago.jpg";
import mobileDetails from "../../../docs/screenshots/mobile-details.jpg";
import mobileDubai from "../../../docs/screenshots/mobile-dubai.jpg";
import { WalkthroughVideo } from "@/components/about/walkthrough-video";
import { Atmosphere } from "@/components/atmosphere/atmosphere";
import { Logo, SiteFooter } from "@/components/site-chrome";
import { site } from "@/config";
import { DEFAULT_SCENE } from "@/lib/atmosphere/scene";

export const metadata: Metadata = {
  title: "Project walkthrough",
  description: `How ${site.name} works, what it does and why it is built this way.`,
};

const FEATURES: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "Search any city",
    body: "Type a few letters and pick from suggestions ranked by population, so a partial name finds the city you most likely mean. It works entirely from the keyboard.",
  },
  {
    title: "Opens where you are",
    body: "The first visit shows the city your IP address points to, without a permission prompt. After that, it opens on the last place you checked. One button uses your precise location.",
  },
  {
    title: "A sentence before the numbers",
    body: "“Rain likely from 4 PM. Cooling to 24° by midnight.” Built by rules from the next 12 hours, it answers the umbrella question first.",
  },
  {
    title: "The next 24 hours and 10 days",
    body: "Rain chances appear once they reach 20%, and sunrise and sunset sit where they happen. The 10-day bars share one scale and are colored by actual temperature, so the shape of the week reads at a glance.",
  },
  {
    title: "Details that come with advice",
    body: "UV says until when you need sun protection. Air quality is there because in cities like Jakarta it is often the number that matters most. Feels-like explains itself.",
  },
  {
    title: "Local time, units and links",
    body: "Times follow the searched city’s time zone. °C and °F switch instantly. The place lives in the URL, and a shared link unfurls into a preview of the current sky.",
  },
  {
    title: "A sky that matches the forecast",
    body: "The background follows the weather and the sun: stars on clear nights, grey on overcast days, rain falling at the real wind’s angle. It is the one expressive part of a calm interface, and it holds still for people who prefer reduced motion.",
  },
];

const DECISIONS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "The server fetches, the client interacts",
    body: "Next.js 16 Server Components request the forecast and cache it for 10 minutes, since Open-Meteo updates every 15. The page arrives rendered. JavaScript in the browser only runs the search box, the unit switch, the location button and the rain.",
  },
  {
    title: "Data is validated at the boundary",
    body: "Every API response is parsed with zod and mapped to the app’s own types. Components never see the provider’s field names.",
  },
  {
    title: "No flash, no refetch",
    body: "The unit preference is read on the server, so °F never flashes as °C first. Switching units rewrites a few text nodes and makes no request.",
  },
  {
    title: "Changes feel continuous",
    body: "Picking another city keeps the current forecast on screen, dimmed, until the next one is ready. Meanwhile the sky animates to the new scene.",
  },
  {
    title: "Checked on every push",
    body: "97 unit tests, including one that computes text contrast on every sky and fails below WCAG AA. CI runs linting, type checks, formatting, the tests and a production build.",
  },
];

const DESKTOP_SHOTS: ReadonlyArray<{ image: StaticImageData; alt: string; caption: string }> = [
  {
    image: desktopChicago,
    alt: "Chicago on a cloudy morning with rain expected",
    caption: "Rain on the way",
  },
  { image: desktopJakarta, alt: "Jakarta on a clear night with stars", caption: "Clear night" },
  { image: desktopSearch, alt: "City search with suggestions for “san”", caption: "Search" },
  {
    image: desktopLanding,
    alt: "The start screen with search and suggested cities",
    caption: "Before a city is chosen",
  },
];

const MOBILE_SHOTS: ReadonlyArray<{ image: StaticImageData; alt: string }> = [
  { image: mobileDubai, alt: "Dubai at dusk on a phone" },
  { image: mobileChicago, alt: "Chicago before rain on a phone" },
  { image: mobileDetails, alt: "Detail cards on a phone" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-20 sm:mt-28">
      <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Notes({ items }: { items: ReadonlyArray<{ title: string; body: string }> }) {
  return (
    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-[13rem_minmax(0,1fr)]">
      {items.map((item) => (
        <div key={item.title} className="contents">
          <dt className="font-medium text-fg">{item.title}</dt>
          <dd className="-mt-4 leading-relaxed text-pretty text-fg-muted sm:mt-0">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

function Shot({ image, alt, sizes }: { image: StaticImageData; alt: string; sizes: string }) {
  return (
    <a href={image.src} target="_blank" rel="noreferrer" className="block">
      <Image
        src={image}
        alt={alt}
        sizes={sizes}
        placeholder="blur"
        className="rounded-xl border border-line transition-opacity hover:opacity-90"
      />
    </a>
  );
}

export default function AboutPage() {
  const { walkthrough } = site;

  return (
    <>
      {/* Fewer stars behind long-form text. */}
      <Atmosphere scene={{ ...DEFAULT_SCENE, starOpacity: 0.35 }} />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full py-1 pr-2 text-[15px] font-medium tracking-tight"
        >
          <Logo className="size-5" />
          {site.name}
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-panel px-4 text-sm font-medium backdrop-blur-xl transition-[background-color,transform] duration-150 ease-out hover:bg-white/15 active:scale-[0.97]"
        >
          Open the app
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-5xl flex-1 px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="stagger label">Project walkthrough</p>
          <h1
            className="stagger mt-3 text-4xl font-medium tracking-tight sm:text-5xl"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {site.name}, explained
          </h1>
          <p
            className="stagger mt-5 text-lg leading-relaxed text-pretty text-fg-muted"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            {site.name} is a weather app I built for a front-end assessment. The brief was one line:
            show the current weather and a forecast for a location the user chooses. The scope, the
            design and the details were mine to decide.
            {walkthrough.video
              ? " The video walks through the app, and the notes below cover the same ground in writing."
              : " The notes below cover what it does, how it is built and what I left out."}
          </p>
          <div
            className="stagger mt-8 flex flex-wrap gap-3"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-medium text-neutral-900 transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Open the app
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <a
              href={site.repository}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-panel px-5 text-[15px] font-medium backdrop-blur-xl transition-[background-color,transform] duration-150 ease-out hover:bg-white/15 active:scale-[0.97]"
            >
              Source on GitHub
              <ArrowUpRight aria-hidden className="size-4" />
            </a>
          </div>
        </div>

        {walkthrough.video && (
          <div className="stagger mt-14" style={{ "--i": 4 } as React.CSSProperties}>
            <WalkthroughVideo
              src={walkthrough.video}
              poster={walkthrough.poster}
              chapters={walkthrough.chapters}
              label={`Walkthrough of ${site.name}`}
            />
          </div>
        )}

        <Section title="What it does, and why">
          <Notes items={FEATURES} />
        </Section>

        <Section title="Screenshots">
          <Shot
            image={desktopDubai}
            alt="Dubai at dusk: 32°, clear, with the next 24 hours and the 10-day forecast"
            sizes="(min-width: 1024px) 64rem, 100vw"
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {DESKTOP_SHOTS.map((shot) => (
              <figure key={shot.caption}>
                <Shot image={shot.image} alt={shot.alt} sizes="(min-width: 640px) 32rem, 100vw" />
                <figcaption className="mt-2 text-sm text-fg-subtle">{shot.caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {MOBILE_SHOTS.map((shot) => (
              <Shot
                key={shot.alt}
                image={shot.image}
                alt={shot.alt}
                sizes="(min-width: 1024px) 21rem, 33vw"
              />
            ))}
          </div>
        </Section>

        <Section title="How it’s built">
          <Notes items={DECISIONS} />
          <p className="mt-8 text-sm text-fg-subtle">
            Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Open-Meteo · Vercel
          </p>
        </Section>

        <Section title="Left out on purpose">
          <div className="max-w-3xl space-y-4 leading-relaxed text-pretty text-fg-muted">
            <p>
              There is no radar map. It needs a tile provider, usually an API key, and it would
              outweigh the rest of the app. Severe weather alerts are missing too, because
              Open-Meteo has no global feed and national ones differ by country. Recent places cover
              going back to a city, so there are no accounts.
            </p>
            <p>
              With more time I would add saved places, minute-by-minute rain for the next two hours,
              and end-to-end tests for search and location.
            </p>
          </div>
        </Section>
      </main>

      <SiteFooter />
    </>
  );
}
