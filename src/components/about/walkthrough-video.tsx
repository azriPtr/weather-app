"use client";

import { useRef, useState } from "react";

import type { Chapter } from "@/config";

function timestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

/** Native controls for accessibility, plus chapters that seek and follow playback. */
export function WalkthroughVideo({
  src,
  poster,
  chapters,
  label,
}: {
  src: string;
  poster?: string | null;
  chapters: Chapter[];
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);

  const onTimeUpdate = () => {
    const time = ref.current?.currentTime ?? 0;
    const index = Math.max(
      chapters.findLastIndex((chapter) => chapter.time <= time),
      0,
    );
    if (index !== current) setCurrent(index);
  };

  const seek = (time: number) => {
    const video = ref.current;
    if (!video) return;
    video.currentTime = time;
    void video.play();
  };

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-black/40 shadow-2xl shadow-black/30">
        <video
          ref={ref}
          src={src}
          poster={poster ?? undefined}
          controls
          playsInline
          preload="metadata"
          aria-label={label}
          onTimeUpdate={onTimeUpdate}
          className="aspect-video w-full bg-black"
        />
      </div>

      {chapters.length > 0 && (
        <nav aria-label="Chapters" className="mt-4">
          <ol className="grid gap-1 sm:grid-cols-2">
            {chapters.map((chapter, index) => (
              <li key={chapter.time}>
                <button
                  type="button"
                  onClick={() => seek(chapter.time)}
                  aria-current={index === current ? "step" : undefined}
                  className="flex w-full items-baseline gap-3 rounded-xl px-3 py-2 text-left text-fg-muted transition-colors hover:bg-white/8 hover:text-fg aria-[current=step]:bg-white/10 aria-[current=step]:text-fg"
                >
                  <span className="w-10 shrink-0 text-sm text-fg-subtle tabular-nums">
                    {timestamp(chapter.time)}
                  </span>
                  {chapter.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
