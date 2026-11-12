import Link from "next/link";
import { ArchFrame } from "@/components/arch-frame";
import { buttonStyles } from "@/components/button-styles";
import { CameraIcon, ChatIcon } from "@/components/icons";
import { Marquee } from "@/components/marquee";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { getCategories, getProducts, getUpcomingExhibitions } from "@/lib/catalog";
import { formatDateRange } from "@/lib/format";
import { contactLink, site } from "@/lib/site";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

export default async function HomePage() {
  const [products, categories, exhibitions] = await Promise.all([
    getProducts(),
    getCategories(),
    getUpcomingExhibitions(),
  ]);

  // Featured pieces, falling back to the newest pieces if none are marked featured
  const featuredOnly = products.filter((product) => product.isFeatured);
  const featured = (featuredOnly.length > 0 ? featuredOnly : products).slice(0, 4);

  const heroImages = featured.flatMap((product) => (product.images[0] ? [product.images[0]] : []));
  const [heroMain, heroSecondary] = heroImages;
  const makerImage = heroImages[2] ?? heroMain;

  // Only categories that actually have pieces, each with its first photo as the cover
  const collections = categories.flatMap((category) => {
    const inCategory = products.filter((product) => product.category?.id === category.id);
    if (inCategory.length === 0) return [];
    const cover = inCategory.find((product) => product.images[0])?.images[0];
    return [{ category, count: inCategory.length, cover }];
  });

  const contact = contactLink("Hello! I'd love to know more about your jewellery.");

  return (
    <>
      {/* Hero */}
      <section className={`${container} grid items-center gap-12 pt-10 pb-20 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:pt-20 lg:pb-28`}>
        <div className="flex flex-col items-start gap-6">
          <p lang="mr" className="font-devanagari text-5xl text-primary sm:text-6xl lg:text-7xl">
            {site.nameMarathi}
          </p>
          <h1 className="text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Handmade jewellery, <em className="text-accent">one of a kind</em>
          </h1>
          <p className="max-w-md text-lg text-fg-muted">
            Pearl strands, beaded necklaces, and temple pendants, each piece made by hand by{" "}
            {site.founder}.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className={buttonStyles.primary}>
              Shop the collection
            </Link>
            <a href={contact.href} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
              <ChatIcon />
              {contact.label}
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
          <ArchFrame className="aspect-[4/5] w-full lg:ml-auto lg:w-[80%]">
            {heroMain ? (
              <ProductImage image={heroMain} sizes="(min-width: 1024px) 40vw, 90vw" priority />
            ) : (
              <div className="flex h-full items-center justify-center font-devanagari text-8xl text-fg-muted/40">
                आ
              </div>
            )}
          </ArchFrame>
          {heroSecondary && (
            <ArchFrame className="absolute -bottom-8 -left-2 hidden aspect-[4/5] w-[42%] ring-8 ring-surface sm:block lg:left-0">
              <ProductImage image={heroSecondary} sizes="20vw" />
            </ArchFrame>
          )}
        </div>
      </section>

      <Marquee />

      {/* Featured pieces */}
      {featured.length > 0 && (
        <section className={`${container} py-20 lg:py-28`}>
          <Reveal>
            <SectionHeading
              eyebrow="Featured"
              title="Pieces we love"
              description="A few favourites from the latest collection, each one made by hand."
            />
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4 lg:[&>*:nth-child(even)]:mt-16">
            {featured.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.08}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
          <div className="mt-14 flex justify-center">
            <Link href="/shop" className={buttonStyles.secondary}>
              View all pieces
            </Link>
          </div>
        </section>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <section className="bg-surface-raised py-20 lg:py-28">
          <div className={container}>
            <Reveal>
              <SectionHeading eyebrow="Collections" title="Browse by style" />
            </Reveal>
            <ul className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map(({ category, count, cover }, index) => (
                <li key={category.id}>
                  <Reveal delay={index * 0.08}>
                    <Link
                      href={`/shop?category=${category.slug}`}
                      className="group block rounded-t-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line"
                    >
                      <ArchFrame className="aspect-[3/4]">
                        {cover && (
                          <ProductImage
                            image={cover}
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        )}
                      </ArchFrame>
                      <div className="mt-4 text-center">
                        <h3 className="font-display text-2xl transition-colors group-hover:text-primary">
                          {category.name}
                        </h3>
                        <p className="text-sm text-fg-muted">
                          {count} {count === 1 ? "piece" : "pieces"}
                        </p>
                      </div>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* The maker */}
      <section className={`${container} grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20 lg:py-28`}>
        <Reveal className="mx-auto w-full max-w-sm lg:max-w-md">
          <ArchFrame className="aspect-[4/5]">
            {makerImage && <ProductImage image={makerImage} sizes="(min-width: 1024px) 40vw, 90vw" />}
          </ArchFrame>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-6">
          <SectionHeading align="left" eyebrow="The maker" title={`Made by hand by ${site.founder}`} />
          {/* PLACEHOLDER STORY: replace with Kavita's real story before the reveal */}
          <p className="max-w-prose text-fg-muted">
            Every Avishkar piece begins at Kavita&apos;s worktable, where pearls, glass beads, and
            temple-style pendants are chosen one by one and strung by hand.
          </p>
          <p className="max-w-prose text-fg-muted">
            Inspired by traditional Maharashtrian jewellery, her designs bring classic forms like the
            tanmani and mangalsutra together with bright, joyful colour, made to be worn and loved.
          </p>
          <div>
            <Link href="/about" className={buttonStyles.secondary}>
              Read her story
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Upcoming exhibitions */}
      <section className="bg-surface-raised py-20 lg:py-28">
        <div className={container}>
          <Reveal>
            <SectionHeading
              eyebrow="Exhibitions"
              title="Meet us in person"
              description="See and try on pieces at our next exhibition."
            />
          </Reveal>
          {exhibitions.length > 0 ? (
            <ul className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
              {exhibitions.map((exhibition, index) => (
                <li key={exhibition.id}>
                  <Reveal delay={index * 0.08} className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-surface p-6">
                    <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
                      {formatDateRange(exhibition.start_date, exhibition.end_date)}
                    </p>
                    <h3 className="font-display text-2xl">{exhibition.title}</h3>
                    <p className="text-fg-muted">
                      {exhibition.venue}, {exhibition.city}
                    </p>
                    {exhibition.notes && <p className="text-sm text-fg-muted">{exhibition.notes}</p>}
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <Reveal className="mx-auto mt-10 flex max-w-md flex-col items-center gap-6 text-center">
              <p className="text-fg-muted">
                No exhibitions are scheduled right now. Follow us on Instagram to hear about the next one.
              </p>
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
                <CameraIcon />@{site.instagramHandle}
              </a>
            </Reveal>
          )}
        </div>
      </section>

      {/* Instagram */}
      <section className={`${container} py-20 lg:py-28`}>
        <Reveal className="flex flex-col items-center gap-6 text-center">
          <p className="text-xs font-medium tracking-[0.25em] text-accent uppercase">Follow along</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">@{site.instagramHandle}</h2>
          <p className="max-w-md text-fg-muted">New pieces and exhibition updates, shared first on Instagram.</p>
          <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
            <CameraIcon />
            Follow on Instagram
          </a>
        </Reveal>
      </section>
    </>
  );
}
