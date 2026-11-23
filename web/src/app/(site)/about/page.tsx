import type { Metadata } from "next";
import Link from "next/link";
import { ArchFrame } from "@/components/arch-frame";
import { buttonStyles } from "@/components/button-styles";
import { CameraIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { getProducts } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Meet ${site.founder}, the maker behind Avishkar Creations: handmade jewellery from ${site.location}.`,
};

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

const steps = [
  {
    title: "Choosing",
    text: "Every piece starts with the materials: pearls, glass and crystal beads, and pendants picked for colour and character.",
  },
  {
    title: "Stringing",
    text: "Each strand is strung and knotted by hand, bead by bead, so the piece sits and moves just right.",
  },
  {
    title: "Finishing",
    text: "Clasps, spacers, and matching earrings are added last, and every piece is checked before it finds its new home.",
  },
];

const values = [
  { title: "Handmade", text: "Made by hand, never mass-produced." },
  { title: "One of a kind", text: "Small batches mean no two pieces are exactly alike." },
  { title: "Made with love", text: "Made with care, to be worn and treasured." },
];

export default async function AboutPage() {
  const products = await getProducts();
  const featured = products.filter((product) => product.isFeatured);
  const photos = (featured.length > 0 ? featured : products).flatMap((product) =>
    product.images[0] ? [product.images[0]] : [],
  );
  const [introPhoto, storyPhoto] = photos;

  return (
    <>
      {/* Intro */}
      <section className={`${container} grid items-center gap-12 pt-12 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-20`}>
        <div className="flex flex-col gap-6">
          <SectionHeading as="h1" align="left" eyebrow="Our story" title={`Meet ${site.founder}`} />
          <p className="max-w-prose text-lg text-fg-muted">
            <span lang="mr" className="font-devanagari text-2xl text-primary">
              {site.nameMarathi}
            </span>{" "}
            means invention, a new creation. It&apos;s a fitting name for jewellery where every piece is
            made by hand and no two are exactly alike.
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <ArchFrame className="aspect-[4/5]">
            {introPhoto && <ProductImage image={introPhoto} sizes="(min-width: 1024px) 30vw, 90vw" priority />}
          </ArchFrame>
        </div>
      </section>

      {/* Story */}
      <section className="bg-surface-raised py-20 lg:py-28">
        <div className={`${container} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
          <Reveal className="mx-auto w-full max-w-sm lg:order-2 lg:max-w-md">
            <ArchFrame className="aspect-[4/5]">
              {storyPhoto && <ProductImage image={storyPhoto} sizes="(min-width: 1024px) 40vw, 90vw" />}
            </ArchFrame>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-5">
            <SectionHeading align="left" eyebrow="How it began" title="A love for traditional jewellery" />
            {/* PLACEHOLDER STORY: replace with Kavita's real story before the reveal */}
            <p className="max-w-prose text-fg-muted">
              From her home in {site.location}, Kavita creates jewellery inspired by the pieces she grew
              up admiring: pearl strands, temple pendants, and the classic Maharashtrian tanmani and
              mangalsutra.
            </p>
            <p className="max-w-prose text-fg-muted">
              What began as a love for beads and colour grew into Avishkar Creations, with collections she
              shares at exhibitions and with customers who find her on Instagram.
            </p>
            <p className="max-w-prose text-fg-muted">
              Every piece is made in small batches, so each one carries a little of her care and attention.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Process */}
      <section className={`${container} py-20 lg:py-28`}>
        <Reveal>
          <SectionHeading eyebrow="The craft" title="How each piece is made" />
        </Reveal>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 0.08} className="flex flex-col gap-3 text-center sm:text-left">
                <span aria-hidden="true" className="font-display text-5xl text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl">{step.title}</h3>
                <p className="text-fg-muted">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* Values */}
      <section className="bg-surface-raised py-20 lg:py-28">
        <div className={container}>
          <Reveal>
            <SectionHeading eyebrow="What we stand for" title="The Avishkar promise" />
          </Reveal>
          <ul className="mt-14 grid gap-6 sm:grid-cols-3">
            {values.map((value, index) => (
              <li key={value.title}>
                <Reveal
                  delay={index * 0.08}
                  className="flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center"
                >
                  <span aria-hidden="true" className="text-xl text-accent-line">
                    ✦
                  </span>
                  <h3 className="font-display text-2xl">{value.title}</h3>
                  <p className="text-fg-muted">{value.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Call to action */}
      <section className={`${container} py-20 lg:py-28`}>
        <Reveal className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">Find your piece</h2>
          <p className="max-w-md text-fg-muted">Browse the collection, or follow along for new pieces and exhibition dates.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/shop" className={buttonStyles.primary}>
              Shop the collection
            </Link>
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
              <CameraIcon />
              Follow on Instagram
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
