type ReverseGeocodeResult = {
  name: string;
  region: string | null;
};

const ENDPOINT = "https://api.bigdatacloud.net/data/reverse-geocode-client";

/**
 * Turns coordinates from the Geolocation API into a city name. BigDataCloud's
 * client endpoint is free and keyless for exactly this use: a browser looking
 * up its own position. Returns `null` on any failure; the caller falls back to
 * a generic label.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: "en",
    });
    const response = await fetch(`${ENDPOINT}?${params}`, { signal });
    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, unknown>;
    const text = (value: unknown) =>
      typeof value === "string" && value.trim() ? value.trim() : null;

    const name = text(data.city) ?? text(data.locality) ?? text(data.principalSubdivision);
    if (!name) return null;

    const country = text(data.countryName);
    return { name, region: country && country !== name ? country : null };
  } catch {
    return null;
  }
}
