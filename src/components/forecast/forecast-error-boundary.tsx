"use client";

import { CloudOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Component, useTransition, type ReactNode } from "react";

type BoundaryProps = {
  resetKey: string;
  fallback: (reset: () => void) => ReactNode;
  children: ReactNode;
};

type BoundaryState = { failed: boolean; resetKey: string };

/**
 * Next's `catchError` only resets on a pathname change. Places differ by
 * search params, so this boundary resets when the place changes instead,
 * without remounting the Suspense boundary inside it.
 */
class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState) {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey };
  }

  reset = () => this.setState({ failed: false });

  render() {
    return this.state.failed ? this.props.fallback(this.reset) : this.props.children;
  }
}

export function ForecastErrorBoundary({
  resetKey,
  children,
}: {
  resetKey: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Boundary
      resetKey={resetKey}
      fallback={(reset) => (
        <div role="alert" className="mx-auto max-w-md py-24 text-center sm:py-32">
          <CloudOff aria-hidden className="mx-auto size-8 text-fg-subtle" strokeWidth={1.5} />
          <h1 className="mt-5 text-2xl font-medium tracking-tight">The forecast didn’t load</h1>
          <p className="mt-2 text-fg-muted">
            Open-Meteo didn’t respond in time. Check your connection, then try again.
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                router.refresh();
                reset();
              })
            }
            className="mt-6 h-11 rounded-full bg-white px-6 text-[15px] font-medium text-neutral-900 transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
          >
            {isPending ? "Retrying…" : "Try again"}
          </button>
        </div>
      )}
    >
      {children}
    </Boundary>
  );
}
