"use client";

import { useRef, useState } from "react";
import { ArchFrame } from "@/components/arch-frame";
import { CloseIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import type { CatalogImage } from "@/lib/catalog";

type ProductGalleryProps = {
  images: CatalogImage[];
  productName: string;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/**
 * Arch photo with thumbnails, plus a full-screen viewer showing the complete, uncropped photo.
 * The viewer is a native <dialog>: focus is trapped, Escape closes it, and the page behind is inert.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const active = images[activeIndex];
  const hasMany = images.length > 1;

  function step(offset: number) {
    setActiveIndex((index) => (index + offset + images.length) % images.length);
  }

  function openViewer() {
    dialogRef.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  }

  if (!active) {
    return (
      <ArchFrame className="aspect-[4/5]">
        <div className="flex h-full items-center justify-center font-devanagari text-8xl text-fg-muted/40">आ</div>
      </ArchFrame>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={openViewer}
        aria-label={`View full photo of ${productName}`}
        className={`relative block w-full rounded-t-full ${focusRing}`}
      >
        <ArchFrame className="aspect-[4/5]">
          <ProductImage
            key={active.id}
            image={active}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={activeIndex === 0}
          />
        </ArchFrame>
        <span className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-surface/90 px-3 py-2 text-xs text-fg backdrop-blur">
          <svg {...iconProps} className="size-4">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          View full photo
        </span>
      </button>

      {hasMany && (
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show photo ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={`block size-16 overflow-hidden rounded-lg border-2 transition-opacity sm:size-20 ${focusRing} ${
                  index === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <ProductImage image={image} sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`Photos of ${productName}`}
        onClose={() => {
          document.documentElement.style.overflow = "";
        }}
        onKeyDown={(event) => {
          if (!hasMany) return;
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-black/95 text-white backdrop:bg-black/80"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-white/80">
              {hasMany ? `${activeIndex + 1} / ${images.length}` : productName}
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close photo viewer"
              className={`inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10 ${focusRing}`}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- full uncropped photo; static export serves our own WebP files */}
            <img
              src={active.src}
              srcSet={active.srcSet}
              sizes="100vw"
              alt={active.alt}
              width={active.width}
              height={active.height}
              className="max-h-full max-w-full object-contain"
            />

            {hasMany && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className={`absolute top-1/2 left-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 ${focusRing}`}
                >
                  <svg {...iconProps} className="size-6">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className={`absolute top-1/2 right-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 ${focusRing}`}
                >
                  <svg {...iconProps} className="size-6">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
