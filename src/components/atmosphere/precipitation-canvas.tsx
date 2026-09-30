"use client";

import { useEffect, useRef } from "react";

import type { PrecipitationType } from "@/lib/atmosphere/scene";

type Particle = {
  x: number;
  y: number;
  speed: number;
  length: number;
  size: number;
  phase: number;
};

/** Particles for a 1440×900 viewport at full intensity; scaled by area. */
const DENSITY = { rain: 280, snow: 170 } as const;
const REFERENCE_AREA = 1440 * 900;

/**
 * Rain and snow on a single canvas: one path, one stroke or fill per frame.
 * The animation pauses when the tab is hidden and never starts for people who
 * prefer reduced motion.
 */
export function PrecipitationCanvas({
  type,
  intensity,
  lean,
}: {
  type: PrecipitationType;
  intensity: number;
  lean: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const active = type !== "none" && intensity > 0;

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || type === "none" || intensity <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isRain = type === "rain";
    // Horizontal distance travelled per pixel of fall.
    const slope = isRain ? lean : lean * 1.2;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let last = performance.now();

    const spawn = (anywhere: boolean): Particle => ({
      x: Math.random() * (width + Math.abs(slope) * height) - Math.max(slope, 0) * height,
      y: anywhere ? Math.random() * height : -24 - Math.random() * 40,
      speed: isRain ? 620 + Math.random() * 480 : 26 + Math.random() * 44,
      length: 10 + Math.random() * 16,
      size: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const area = Math.min((width * height) / REFERENCE_AREA, 1.5);
      const count = Math.round(DENSITY[type] * intensity * area);
      particles = Array.from({ length: count }, () => spawn(true));
    };

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      context.clearRect(0, 0, width, height);
      context.beginPath();

      if (isRain) {
        context.strokeStyle = `rgba(255, 255, 255, ${0.16 + intensity * 0.14})`;
        context.lineWidth = 1;
        context.lineCap = "round";
        for (const particle of particles) {
          particle.y += particle.speed * dt;
          particle.x += particle.speed * slope * dt;
          if (particle.y - particle.length > height) Object.assign(particle, spawn(false));
          context.moveTo(particle.x, particle.y);
          context.lineTo(particle.x - slope * particle.length, particle.y - particle.length);
        }
        context.stroke();
      } else {
        context.fillStyle = "rgba(255, 255, 255, 0.7)";
        for (const particle of particles) {
          particle.phase += dt * 0.8;
          particle.y += particle.speed * dt;
          particle.x += (Math.sin(particle.phase) * 14 + particle.speed * slope) * dt;
          if (particle.y > height + 8) Object.assign(particle, spawn(false));
          context.moveTo(particle.x + particle.size, particle.y);
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        }
        context.fill();
      }

      frame = requestAnimationFrame(draw);
    };

    const onVisibilityChange = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible") {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [type, intensity, lean]);

  return <canvas ref={ref} className="atmosphere-precipitation" data-active={active} />;
}
