import { describe, expect, it } from "vitest";

import { createFormatters } from "./format";
import { placeHref, placeKey, roundCoordinate } from "./place";
import { placeFromSearchParams } from "./place-params";
import { toPlaces } from "./weather/open-meteo/schema";

describe("placeFromSearchParams", () => {
  it("parses and rounds coordinates to about 1 km", () => {
    expect(placeFromSearchParams({ lat: "-6.214621", lon: "106.845131", name: "Jakarta" })).toEqual(
      { latitude: -6.21, longitude: 106.85, name: "Jakarta", region: null },
    );
  });

  it("rejects missing, empty or out-of-range coordinates", () => {
    expect(placeFromSearchParams({})).toBeNull();
    expect(placeFromSearchParams({ lat: "", lon: "" })).toBeNull();
    expect(placeFromSearchParams({ lat: "91", lon: "0" })).toBeNull();
    expect(placeFromSearchParams({ lat: "abc", lon: "0" })).toBeNull();
  });

  it("names an unnamed place by its coordinates", () => {
    expect(placeFromSearchParams({ lat: "51.5", lon: "-0.12" })?.name).toBe("51.50°N, 0.12°W");
  });

  it("round-trips through placeHref", () => {
    const place = { latitude: 35.69, longitude: 139.69, name: "Tokyo", region: "Japan" };
    const url = new URL(placeHref(place), "http://localhost");
    expect(placeFromSearchParams(url.searchParams)).toEqual(place);
  });
});

describe("coordinates", () => {
  it("avoids negative zero in keys", () => {
    expect(roundCoordinate(-0.001)).toBe(0);
    expect(placeKey({ latitude: -0.001, longitude: 10.004 })).toBe("0,10");
  });
});

describe("toPlaces", () => {
  it("ranks by population and removes duplicates", () => {
    const places = toPlaces({
      results: [
        { name: "Jakar", latitude: 27.5, longitude: 90.7, country: "Bhutan", population: 6243 },
        {
          name: "Jakarta",
          latitude: -6.2,
          longitude: 106.8,
          country: "Indonesia",
          admin1: "Jakarta",
          population: 8_540_121,
        },
        { name: "Jakar", latitude: 27.6, longitude: 90.8, country: "Bhutan", population: 10 },
      ],
    });

    expect(places.map((place) => place.name)).toEqual(["Jakarta", "Jakar"]);
    expect(places[0].region).toBe("Indonesia");
  });
});

describe("createFormatters", () => {
  // 2026-01-01 00:00 UTC is 09:00 in Tokyo and 19:00 the previous day in New York.
  const instant = Date.UTC(2026, 0, 1, 0, 0) / 1000;

  it("formats in the place's time zone, not the viewer's", () => {
    expect(createFormatters("Asia/Tokyo", "h23").time(instant)).toBe("09:00");
    expect(createFormatters("America/New_York", "h12").weekday(instant)).toBe("Wed");
  });

  it("says noon and midnight inside sentences", () => {
    const tokyo = createFormatters("Asia/Tokyo", "h12");
    expect(tokyo.moment(instant + 3 * 3600)).toBe("noon");
    expect(tokyo.moment(instant + 15 * 3600)).toBe("midnight");
    expect(createFormatters("Asia/Tokyo", "h23").moment(instant + 6 * 3600)).toBe("15:00");
  });
});
