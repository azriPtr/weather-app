"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const EDGE_TOLERANCE = 4;
const FADE = "2.5rem";

/**
 * Horizontal scroll with edge fades that only appear when there is more to
 * see, plus arrow buttons for mouse users without a trackpad.
 */
export function HourlyScroller({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = () => {
    const element = ref.current;
    if (!element) return;
    const start = element.scrollLeft <= EDGE_TOLERANCE;
    const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - EDGE_TOLERANCE;
    setEdges((previous) =>
      previous.start === start && previous.end === end ? previous : { start, end },
    );
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scroll = (direction: 1 | -1) => {
    const element = ref.current;
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({
      left: direction * element.clientWidth * 0.75,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const mask = `linear-gradient(to right, ${edges.start ? "black" : "transparent"}, black ${FADE}, black calc(100% - ${FADE}), ${edges.end ? "black" : "transparent"})`;

  const arrow =
    "absolute top-1/2 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-panel-strong text-fg-muted opacity-0 shadow-lg shadow-black/20 backdrop-blur-xl transition-[opacity,color,transform] duration-150 group-hover:opacity-100 hover:text-fg focus-visible:opacity-100 active:scale-95 disabled:pointer-events-none disabled:!opacity-0 pointer-fine:grid";

  return (
    <div className="group relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={measure}
        className="relative scrollbar-none overflow-x-auto overscroll-x-contain rounded-xl focus-visible:outline-offset-[-2px]"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Earlier hours"
        disabled={edges.start}
        onClick={() => scroll(-1)}
        className={`${arrow} left-2`}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Later hours"
        disabled={edges.end}
        onClick={() => scroll(1)}
        className={`${arrow} right-2`}
      >
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </div>
  );
}
