export type Level = {
  label: string;
  /** Position of the reading on its scale, 0 to 1. */
  position: number;
};

// https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index
export function uvLevel(uv: number): Level {
  const position = Math.min(uv / 11, 1);
  if (uv < 3) return { label: "Low", position };
  if (uv < 6) return { label: "Moderate", position };
  if (uv < 8) return { label: "High", position };
  if (uv < 11) return { label: "Very high", position };
  return { label: "Extreme", position };
}

export type AqiLevel = Level & { advice: string };

// https://www.airnow.gov/aqi/aqi-basics/
export function aqiLevel(aqi: number): AqiLevel {
  const position = Math.min(aqi / 300, 1);
  if (aqi <= 50) return { label: "Good", position, advice: "Fine for time outdoors." };
  if (aqi <= 100)
    return { label: "Moderate", position, advice: "Unusually sensitive people may notice it." };
  if (aqi <= 150)
    return {
      label: "Unhealthy for sensitive groups",
      position,
      advice: "Sensitive groups should keep outdoor effort short.",
    };
  if (aqi <= 200)
    return { label: "Unhealthy", position, advice: "Cut back on long or heavy outdoor exertion." };
  if (aqi <= 300)
    return { label: "Very unhealthy", position, advice: "Avoid long or heavy outdoor exertion." };
  return { label: "Hazardous", position, advice: "Stay indoors and keep activity low." };
}

export function visibilityNote(meters: number): string {
  if (meters >= 10_000) return "Clear view to the horizon.";
  if (meters >= 4_000) return "Light haze in the distance.";
  if (meters >= 1_000) return "Haze is limiting the view.";
  return "Fog is limiting the view.";
}
