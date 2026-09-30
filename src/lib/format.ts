export type HourCycle = "h12" | "h23";

/**
 * Every time on screen is shown in the forecast location's time zone, not the
 * viewer's. Checking Tokyo from Jakarta should show Tokyo's 3 PM.
 * Copy stays English; only the 12/24-hour clock follows the viewer's locale.
 */
export function createFormatters(timeZone: string, hourCycle: HourCycle) {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle,
    hour: hourCycle === "h12" ? "numeric" : "2-digit",
  });
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle,
    hour: "numeric",
    minute: "2-digit",
  });
  const hourOfDay = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
  });
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" });
  const weekdayLong = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" });

  return {
    hour: (unix: number) => hour.format(unix * 1000),
    time: (unix: number) => time.format(unix * 1000),
    /** For use inside a sentence: "3 PM" or "15:00", with "noon" and "midnight". */
    moment: (unix: number) => {
      const value = Number(hourOfDay.format(unix * 1000)) % 24;
      if (value === 0) return "midnight";
      if (value === 12) return "noon";
      return hourCycle === "h12" ? hour.format(unix * 1000) : time.format(unix * 1000);
    },
    weekday: (unix: number) => weekday.format(unix * 1000),
    weekdayLong: (unix: number) => weekdayLong.format(unix * 1000),
    clock: (unix: number) => `${weekday.format(unix * 1000)} ${time.format(unix * 1000)}`,
  };
}

export type Formatters = ReturnType<typeof createFormatters>;

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
}
