type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: Heading = "h2",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto items-center text-center" : "items-start text-left";

  return (
    <div className={`flex max-w-2xl flex-col gap-3 ${alignment}`}>
      {eyebrow && (
        <p className="text-xs font-medium tracking-[0.25em] text-accent uppercase">{eyebrow}</p>
      )}
      <Heading className="text-3xl sm:text-4xl lg:text-5xl">{title}</Heading>
      <span aria-hidden="true" className="h-px w-16 bg-accent-line" />
      {description && <p className="max-w-prose text-fg-muted">{description}</p>}
    </div>
  );
}
