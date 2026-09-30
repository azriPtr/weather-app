import type { CSSProperties } from "react";

import type { Scene } from "@/lib/atmosphere/scene";

import { PrecipitationCanvas } from "./precipitation-canvas";
import { Stars } from "./stars";

const CLOUDS = [
  { width: "72vmax", top: "-14%", left: "-22%", duration: "150s", delay: "-40s", strength: 1 },
  { width: "58vmax", top: "4%", left: "48%", duration: "180s", delay: "-95s", strength: 0.85 },
  { width: "84vmax", top: "30%", left: "-12%", duration: "210s", delay: "-20s", strength: 0.55 },
  { width: "56vmax", top: "58%", left: "52%", duration: "170s", delay: "-130s", strength: 0.45 },
];

/**
 * The page background, driven entirely by CSS custom properties. Because the
 * properties are registered with @property, a new scene transitions smoothly
 * instead of cutting. Rendered on the server, so the first paint is correct.
 */
export function Atmosphere({ scene }: { scene: Scene }) {
  const style = {
    "--sky-top": scene.skyTop,
    "--sky-bottom": scene.skyBottom,
    "--glow-color": scene.glowColor,
    "--glow-x": scene.glowX,
    "--glow-y": scene.glowY,
    "--cloud-color": scene.cloudColor,
    "--cloud-opacity": scene.cloudOpacity,
    "--star-opacity": scene.starOpacity,
    "--haze-opacity": scene.hazeOpacity,
  } as CSSProperties;

  return (
    <div aria-hidden className="atmosphere" style={style} data-phase={scene.phase}>
      {/* Panels are not inside this element, so the glass tint goes on :root. */}
      <style dangerouslySetInnerHTML={{ __html: `:root{--glass:${scene.glass}}` }} />
      <div className="atmosphere-glow" />
      <Stars />
      {CLOUDS.map((cloud) => (
        <div
          key={cloud.left + cloud.top}
          className="atmosphere-cloud"
          style={
            {
              "--w": cloud.width,
              "--top": cloud.top,
              "--left": cloud.left,
              "--duration": cloud.duration,
              "--delay": cloud.delay,
              "--strength": cloud.strength,
            } as CSSProperties
          }
        />
      ))}
      <PrecipitationCanvas
        type={scene.precipitation}
        intensity={scene.intensity}
        lean={scene.lean}
      />
      <div className="atmosphere-haze" />
      <div className="atmosphere-grain" />
    </div>
  );
}
