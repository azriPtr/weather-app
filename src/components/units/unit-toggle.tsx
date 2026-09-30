"use client";

import type { UnitSystem } from "@/lib/weather/types";

import { useUnits } from "./unit-provider";

const OPTIONS: ReadonlyArray<{ value: UnitSystem; label: string; name: string }> = [
  { value: "metric", label: "°C", name: "Celsius" },
  { value: "imperial", label: "°F", name: "Fahrenheit" },
];

/** Native radios underneath, so arrow keys and screen readers work for free. */
export function UnitToggle() {
  const { system, setSystem } = useUnits();

  return (
    <fieldset className="relative grid h-11 shrink-0 grid-cols-2 panel rounded-full p-1">
      <legend className="sr-only">Units</legend>
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white/18 transition-transform duration-200 ease-out-strong"
        style={{ transform: system === "imperial" ? "translateX(100%)" : undefined }}
      />
      {OPTIONS.map((option) => {
        const checked = option.value === system;
        return (
          <label
            key={option.value}
            className={`relative grid w-10 cursor-pointer place-items-center rounded-full text-sm font-medium tabular-nums transition-colors has-focus-visible:outline-2 has-focus-visible:outline-white/90 ${
              checked ? "text-fg" : "text-fg-subtle hover:text-fg-muted"
            }`}
          >
            <input
              type="radio"
              name="units"
              value={option.value}
              checked={checked}
              onChange={() => setSystem(option.value)}
              className="sr-only"
            />
            <span aria-hidden>{option.label}</span>
            <span className="sr-only">{option.name}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
