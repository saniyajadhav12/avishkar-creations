// Temporary design preview. Replaced by the real home page in Phase 2.
const swatches = [
  { name: "surface", className: "bg-surface" },
  { name: "surface-raised", className: "bg-surface-raised" },
  { name: "fg", className: "bg-fg" },
  { name: "fg-muted", className: "bg-fg-muted" },
  { name: "primary", className: "bg-primary" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-line", className: "bg-accent-line" },
  { name: "badge", className: "bg-badge" },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-16">
      <section className="flex flex-col items-center gap-3 text-center">
        <p className="font-devanagari text-5xl text-primary">आविष्कार</p>
        <h1 className="text-4xl sm:text-5xl">Avishkar Creations</h1>
        <p className="font-display text-xl text-accent italic">Handmade · One of a kind · Made with love</p>
        <div className="h-px w-24 bg-accent-line" />
        <p className="max-w-prose text-fg-muted">
          Body text in DM Sans. Handmade jewellery by Kavita Jadhav: pearl strands, beaded necklaces,
          temple pendants, and matching earrings. Price example: ₹1,250
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {swatches.map((swatch) => (
          <div key={swatch.name} className="flex flex-col gap-2">
            <div className={`h-16 rounded-md border border-border ${swatch.className}`} />
            <p className="text-sm text-fg-muted">{swatch.name}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-surface-raised p-6">
        <button className="min-h-11 rounded-full bg-primary px-6 text-on-primary transition-colors hover:bg-primary-hover">
          Primary button
        </button>
        <span className="inline-flex min-h-11 items-center rounded-full bg-badge px-4 text-sm text-on-badge">
          Sold out
        </span>
      </section>
    </div>
  );
}
