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
    "https://5raecwmdfoanwqin.public.blob.vercel-storage.com/walkthrough/stratus-walkthrough-202610010654.mp4",
  poster:
    "https://5raecwmdfoanwqin.public.blob.vercel-storage.com/walkthrough/stratus-walkthrough-202610010654.jpg",
  chapters: [
    { time: 0, title: "Introduction" },
    { time: 17, title: "Opens on your city" },
    { time: 34, title: "The answer first" },
    { time: 58, title: "Search" },
    { time: 91, title: "The next 24 hours" },
    { time: 117, title: "10-day forecast" },
    { time: 133, title: "Details with advice" },
    { time: 160, title: "Units and sharing" },
    { time: 181, title: "The sky" },
    { time: 213, title: "Accessibility and other states" },
    { time: 233, title: "Under the hood" },
    { time: 280, title: "What's next" },
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
