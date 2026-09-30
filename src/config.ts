export type Chapter = {
  /** Seconds from the start of the video. */
  time: number;
  title: string;
};

export const site = {
  name: "Stratus",
  description:
    "Current conditions, the next 24 hours and a 10-day forecast for any city, with UV and air quality. The background follows the real sky there.",
  repository: "https://github.com/azriPtr/weather-app",
  walkthrough: {
    /** The recorded walkthrough. The video block stays hidden until this is set. */
    video: null as string | null,
    poster: null as string | null,
    chapters: [] as Chapter[],
  },
};
