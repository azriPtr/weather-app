function Block({ className }: { className: string }) {
  return <div className={`rounded-lg bg-white/10 ${className}`} />;
}

/** Mirrors the loaded layout so nothing jumps when the forecast arrives. */
export function ForecastSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading forecast"
      className="grid grid-cols-[minmax(0,1fr)] gap-4 pt-8 motion-safe:animate-pulse sm:pt-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-5"
    >
      <div className="lg:col-start-1 lg:row-start-1">
        <Block className="h-8 w-48" />
        <Block className="mt-3 h-4 w-40" />
        <Block className="mt-8 h-32 w-56 rounded-2xl" />
        <Block className="mt-6 h-5 w-52" />
        <Block className="mt-5 h-5 w-72" />
      </div>
      <div className="h-44 panel lg:col-start-1 lg:row-start-2" />
      <div className="h-[34rem] panel lg:col-start-2 lg:row-span-2 lg:row-start-1" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-44 panel" />
        ))}
      </div>
    </div>
  );
}
