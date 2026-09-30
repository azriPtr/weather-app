export type Chapter = {
  /** Seconds from the start of the video. */
  time: number;
  title: string;
};

type Walkthrough = {
  /** The video block on /about stays hidden while this is null. */
  video: string | null;
  poster: string | null;
  chapters: Chapter[];
};

/** Hosted on Vercel Blob; see the project page at /about. */
const walkthrough: Walkthrough = {
  video:
    "https://5raecwmdfoanwqin.public.blob.vercel-storage.com/walkthrough/stratus-walkthrough.mp4",
  poster:
    "https://5raecwmdfoanwqin.public.blob.vercel-storage.com/walkthrough/stratus-walkthrough-poster.jpg",
  chapters: [
    { time: 0, title: "Introduction" },
    { time: 12, title: "Opens where you are" },
    { time: 33, title: "Current conditions and summary" },
    { time: 56, title: "Search" },
    { time: 89, title: "Local time and the next 24 hours" },
    { time: 104, title: "10-day forecast" },
    { time: 118, title: "Details with advice" },
    { time: 142, title: "Units and sharing" },
    { time: 163, title: "The sky" },
    { time: 194, title: "Empty, error and mobile states" },
    { time: 212, title: "How it’s built" },
    { time: 274, title: "Scope and what’s next" },
  ],
};

export const site = {
  name: "Stratus",
  /** Browser tab and search results. The tab stays the same as places change. */
  title: "Stratus Weather",
  description:
    "Current conditions, the next 24 hours and a 10-day forecast for any city, with UV and air quality. The background follows the real sky there.",
  repository: "https://github.com/azriPtr/weather-app",
  walkthrough,
};
