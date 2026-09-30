"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { UnitSystem } from "@/lib/weather/types";

type UnitContextValue = {
  system: UnitSystem;
  setSystem: (system: UnitSystem) => void;
};

const UnitContext = createContext<UnitContextValue | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

export function UnitProvider({
  initialSystem,
  children,
}: {
  initialSystem: UnitSystem;
  children: React.ReactNode;
}) {
  const [system, setSystemState] = useState(initialSystem);

  const setSystem = useCallback((next: UnitSystem) => {
    setSystemState(next);
    // Read by the server on the next request, so the first paint is right.
    document.cookie = `units=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }, []);

  const value = useMemo(() => ({ system, setSystem }), [system, setSystem]);

  return <UnitContext value={value}>{children}</UnitContext>;
}

export function useUnits(): UnitContextValue {
  const context = useContext(UnitContext);
  if (!context) throw new Error("useUnits must be used inside <UnitProvider>");
  return context;
}
