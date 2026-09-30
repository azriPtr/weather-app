import { describe, expect, it } from "vitest";

import { describeCondition } from "./conditions";
import { aqiLevel, uvLevel } from "./levels";
import { rangeSegment, temperatureColor } from "./temperature-scale";
import {
  compassDirection,
  formatDistance,
  formatPrecipitation,
  formatSpeed,
  formatTemperature,
} from "./units";

describe("formatTemperature", () => {
  it("rounds Celsius and converts to Fahrenheit", () => {
    expect(formatTemperature(21.6, "metric")).toBe("22°");
    expect(formatTemperature(21.6, "imperial")).toBe("71°");
  });

  it("never renders negative zero", () => {
    expect(formatTemperature(-0.4, "metric")).toBe("0°");
    expect(formatTemperature(-17.9, "imperial")).toBe("0°");
  });
});

describe("other units", () => {
  it("converts speed", () => {
    expect(formatSpeed(16.09344, "imperial")).toEqual({ value: "10", unit: "mph" });
    expect(formatSpeed(12.4, "metric")).toEqual({ value: "12", unit: "km/h" });
  });

  it("keeps small precipitation amounts readable", () => {
    expect(formatPrecipitation(0.04, "metric")).toEqual({ value: "<0.1", unit: "mm" });
    expect(formatPrecipitation(2.46, "metric")).toEqual({ value: "2.5", unit: "mm" });
    expect(formatPrecipitation(25.4, "imperial")).toEqual({ value: "1", unit: "in" });
  });

  it("drops the decimal for long distances", () => {
    expect(formatDistance(6_900, "metric")).toEqual({ value: "6.9", unit: "km" });
    expect(formatDistance(24_140, "metric")).toEqual({ value: "24", unit: "km" });
    expect(formatDistance(16_093.44, "imperial")).toEqual({ value: "10", unit: "mi" });
  });

  it("maps degrees to eight compass points, wrapping at 360", () => {
    expect(compassDirection(0)).toBe("N");
    expect(compassDirection(262)).toBe("W");
    expect(compassDirection(350)).toBe("N");
    expect(compassDirection(-45)).toBe("NW");
  });
});

describe("conditions", () => {
  it("uses night labels for clear skies after dark", () => {
    expect(describeCondition(0, true).label).toBe("Sunny");
    expect(describeCondition(0, false).label).toBe("Clear");
  });

  it("falls back for codes outside WMO 4677", () => {
    expect(describeCondition(42).label).toBe("Unknown conditions");
  });
});

describe("levels", () => {
  it("follows the WHO UV bands", () => {
    expect(uvLevel(2.9).label).toBe("Low");
    expect(uvLevel(7).label).toBe("High");
    expect(uvLevel(11).label).toBe("Extreme");
  });

  it("follows the US AQI bands", () => {
    expect(aqiLevel(50).label).toBe("Good");
    expect(aqiLevel(151).label).toBe("Unhealthy");
    expect(aqiLevel(400).position).toBe(1);
  });
});

describe("temperature scale", () => {
  it("places a day's range on the week's track", () => {
    expect(rangeSegment(20, 25, 15, 35)).toEqual({ start: 25, end: 50 });
  });

  it("clamps colors outside the scale", () => {
    expect(temperatureColor(-60)).toBe(temperatureColor(-20));
    expect(temperatureColor(60)).toBe(temperatureColor(42));
  });
});
