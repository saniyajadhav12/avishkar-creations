const phrases = ["Handmade", "One of a kind", "Made with love"];

function MarqueeContent() {
  // Repeated so one copy is always wider than the screen
  const repeated = [...phrases, "आविष्कार", ...phrases, "आविष्कार"];

  return (
    <div className="flex shrink-0 items-center">
      {repeated.map((phrase, index) => (
        <span key={index} className="flex items-center">
          <span
            className={
              phrase === "आविष्कार"
                ? "px-6 font-devanagari text-xl sm:text-2xl"
                : "px-6 font-display text-xl italic sm:text-2xl"
            }
          >
            {phrase}
          </span>
          <span className="text-accent-line">✦</span>
        </span>
      ))}
    </div>
  );
}

/** Slow scrolling brand strip. Pauses on hover; static for visitors who prefer reduced motion. */
export function Marquee() {
  return (
    <div className="overflow-hidden border-y border-border bg-primary py-4 text-on-primary">
      <p className="sr-only">{phrases.join(" · ")}</p>
      <div
        aria-hidden="true"
        className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none"
      >
        <MarqueeContent />
        <MarqueeContent />
      </div>
    </div>
  );
}
