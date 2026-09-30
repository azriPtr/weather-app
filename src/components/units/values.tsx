"use client";

/**
 * Tiny client leaves for unit-dependent values. Everything around them stays a
 * Server Component, and switching °C/°F re-renders only these text nodes.
 */
import {
  formatDistance,
  formatPrecipitation,
  formatSpeed,
  formatTemperature,
  type Measurement,
} from "@/lib/weather/units";

import { useUnits } from "./unit-provider";

export function Temperature({ celsius }: { celsius: number }) {
  const { system } = useUnits();
  return <>{formatTemperature(celsius, system)}</>;
}

function MeasurementValue({
  measurement,
  unitClassName,
}: {
  measurement: Measurement;
  unitClassName?: string;
}) {
  return (
    <>
      {measurement.value}
      <span className={unitClassName}> {measurement.unit}</span>
    </>
  );
}

export function Speed({ kmh, unitClassName }: { kmh: number; unitClassName?: string }) {
  const { system } = useUnits();
  return <MeasurementValue measurement={formatSpeed(kmh, system)} unitClassName={unitClassName} />;
}

export function Precipitation({ mm, unitClassName }: { mm: number; unitClassName?: string }) {
  const { system } = useUnits();
  return (
    <MeasurementValue measurement={formatPrecipitation(mm, system)} unitClassName={unitClassName} />
  );
}

export function Distance({ meters, unitClassName }: { meters: number; unitClassName?: string }) {
  const { system } = useUnits();
  return (
    <MeasurementValue measurement={formatDistance(meters, system)} unitClassName={unitClassName} />
  );
}
