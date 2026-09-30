import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudMoonRain,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  CloudSunRain,
  Moon,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";

const ICONS = {
  sun: Sun,
  moon: Moon,
  cloudSun: CloudSun,
  cloudMoon: CloudMoon,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  hail: CloudHail,
  rain: CloudRain,
  heavyRain: CloudRainWind,
  showersDay: CloudSunRain,
  showersNight: CloudMoonRain,
  snow: CloudSnow,
  snowflake: Snowflake,
  thunder: CloudLightning,
  cloud: Cloud,
} satisfies Record<string, LucideIcon>;

function iconKey(code: number, isDay: boolean): keyof typeof ICONS {
  switch (code) {
    case 0:
      return isDay ? "sun" : "moon";
    case 1:
    case 2:
      return isDay ? "cloudSun" : "cloudMoon";
    case 45:
    case 48:
      return "fog";
    case 51:
    case 53:
    case 55:
      return "drizzle";
    case 56:
    case 57:
    case 66:
    case 67:
      return "hail";
    case 61:
    case 63:
      return "rain";
    case 65:
      return "heavyRain";
    case 80:
    case 81:
    case 82:
      return isDay ? "showersDay" : "showersNight";
    case 71:
    case 73:
    case 75:
    case 85:
    case 86:
      return "snow";
    case 77:
      return "snowflake";
    case 95:
    case 96:
    case 99:
      return "thunder";
    default:
      return "cloud";
  }
}

/** Decorative: pair it with a visible or screen-reader label for the condition. */
export function WeatherIcon({
  code,
  isDay = true,
  className,
}: {
  code: number;
  isDay?: boolean;
  className?: string;
}) {
  const Icon = ICONS[iconKey(code, isDay)];
  return <Icon aria-hidden className={className} strokeWidth={1.5} />;
}
