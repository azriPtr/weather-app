/** Seeded so the server and client draw the same sky. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const next = random(20260930);

const STARS = Array.from({ length: 90 }, (_, index) => ({
  id: index,
  x: (next() * 100).toFixed(2),
  y: (next() * 100).toFixed(2),
  radius: (0.5 + next() * 0.9).toFixed(2),
  opacity: (0.35 + next() * 0.65).toFixed(2),
  twinkle: next() < 0.3,
  delay: `${(next() * -5).toFixed(2)}s`,
}));

export function Stars() {
  return (
    <svg className="atmosphere-stars" xmlns="http://www.w3.org/2000/svg">
      {STARS.map((star) => (
        <circle
          key={star.id}
          cx={`${star.x}%`}
          cy={`${star.y}%`}
          r={star.radius}
          fill="white"
          opacity={star.opacity}
          className={star.twinkle ? "twinkle" : undefined}
          style={star.twinkle ? { animationDelay: star.delay } : undefined}
        />
      ))}
    </svg>
  );
}
