"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { buttonStyles } from "@/components/button-styles";
import { ChevronDownIcon, CloseIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-grid";
import type { CatalogProduct } from "@/lib/catalog";
import {
  filterProducts,
  isSortKey,
  sortLabels,
  sortProducts,
  type FilterOption,
  type SortKey,
} from "@/lib/shop";

type ShopCatalogProps = {
  products: CatalogProduct[];
  categories: FilterOption[];
  colors: FilterOption[];
  materials: FilterOption[];
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

function pieces(count: number): string {
  return `${count} ${count === 1 ? "piece" : "pieces"}`;
}

/** Reads a comma-separated URL value, keeping only slugs that exist */
function parseList(value: string | null, options: FilterOption[]): string[] {
  if (!value) return [];
  const known = new Set(options.map((option) => option.slug));
  return value.split(",").filter((slug) => known.has(slug));
}

function toggle(list: string[], slug: string): string | null {
  const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
  return next.length > 0 ? next.join(",") : null;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm transition-colors ${focusRing} ${
        active ? "border-primary bg-primary text-on-primary" : "border-fg/20 text-fg hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

type FilterGroupsProps = {
  colors: FilterOption[];
  materials: FilterOption[];
  selectedColors: string[];
  selectedMaterials: string[];
  onToggleColor: (slug: string) => void;
  onToggleMaterial: (slug: string) => void;
};

function FilterGroups({
  colors,
  materials,
  selectedColors,
  selectedMaterials,
  onToggleColor,
  onToggleMaterial,
}: FilterGroupsProps) {
  const legendClass = "mb-2 font-sans text-xs font-medium tracking-[0.2em] text-fg-muted uppercase";
  const optionClass = "flex min-h-11 cursor-pointer items-center gap-3 text-sm";

  return (
    <div className="flex flex-col gap-8">
      {colors.length > 0 && (
        <fieldset>
          <legend className={legendClass}>Colour</legend>
          {colors.map((color) => (
            <label key={color.id} className={optionClass}>
              <input
                type="checkbox"
                checked={selectedColors.includes(color.slug)}
                onChange={() => onToggleColor(color.slug)}
                className="size-4 accent-primary"
              />
              <span
                aria-hidden="true"
                className="size-4 rounded-full border border-border"
                style={{ backgroundColor: color.hex }}
              />
              <span>{color.name}</span>
              <span className="ml-auto text-xs text-fg-muted">{color.count}</span>
            </label>
          ))}
        </fieldset>
      )}

      {materials.length > 0 && (
        <fieldset>
          <legend className={legendClass}>Material</legend>
          {materials.map((material) => (
            <label key={material.id} className={optionClass}>
              <input
                type="checkbox"
                checked={selectedMaterials.includes(material.slug)}
                onChange={() => onToggleMaterial(material.slug)}
                className="size-4 accent-primary"
              />
              <span>{material.name}</span>
              <span className="ml-auto text-xs text-fg-muted">{material.count}</span>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}

/**
 * Interactive shop: category chips, colour and material filters, and sorting.
 * Everything runs in the browser on the static data, and the current view lives in the URL
 * (e.g. ?category=bracelets&color=red&material=glass) so it can be shared and bookmarked.
 */
export function ShopCatalog({ products, categories, colors, materials }: ShopCatalogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const categoryParam = searchParams.get("category");
  const category = categories.some((c) => c.slug === categoryParam) ? categoryParam : null;
  const selectedColors = parseList(searchParams.get("color"), colors);
  const selectedMaterials = parseList(searchParams.get("material"), materials);
  const sortParam = searchParams.get("sort");
  const sort: SortKey = isSortKey(sortParam) ? sortParam : "newest";

  const visible = sortProducts(
    filterProducts(products, { category, colors: selectedColors, materials: selectedMaterials }),
    sort,
  );
  const activeFilterCount = selectedColors.length + selectedMaterials.length;

  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const clearFilters = () => updateParams({ color: null, material: null });
  const toggleColor = (slug: string) => updateParams({ color: toggle(selectedColors, slug) });
  const toggleMaterial = (slug: string) => updateParams({ material: toggle(selectedMaterials, slug) });

  function openFilters() {
    dialogRef.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  }

  // Close the mobile filter panel if the screen grows to desktop width, where the sidebar shows
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) dialogRef.current?.close();
    }
    desktop.addEventListener("change", handleChange);
    return () => desktop.removeEventListener("change", handleChange);
  }, []);

  const filterGroups = (
    <FilterGroups
      colors={colors}
      materials={materials}
      selectedColors={selectedColors}
      selectedMaterials={selectedMaterials}
      onToggleColor={toggleColor}
      onToggleMaterial={toggleMaterial}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div
        role="group"
        aria-label="Category"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <Chip active={category === null} onClick={() => updateParams({ category: null })}>
          All ({products.length})
        </Chip>
        {categories.map((option) => (
          <Chip
            key={option.id}
            active={category === option.slug}
            onClick={() => updateParams({ category: option.slug })}
          >
            {option.name} ({option.count})
          </Chip>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 border-y border-border py-3">
        <p aria-live="polite" className="text-sm text-fg-muted">
          {pieces(visible.length)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFilters}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-fg/25 px-4 text-sm lg:hidden ${focusRing}`}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-2 text-xs text-on-primary">{activeFilterCount}</span>
            )}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only text-fg-muted sm:not-sr-only">Sort</span>
            {/* The browser's own arrow is hidden (appearance-none) and replaced with a spaced chevron */}
            <span className="relative">
              <select
                value={sort}
                onChange={(event) => {
                  const value = event.target.value;
                  updateParams({ sort: isSortKey(value) && value !== "newest" ? value : null });
                }}
                className={`min-h-11 appearance-none rounded-full border border-fg/25 bg-surface py-2 pr-11 pl-4 text-sm text-fg ${focusRing}`}
              >
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {sortLabels[key]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-fg-muted" />
            </span>
          </label>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[13rem_1fr]">
        <aside aria-label="Filters" className="hidden lg:flex lg:flex-col lg:gap-6">
          {filterGroups}
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className={`self-start text-sm text-primary underline ${focusRing}`}>
              Clear filters
            </button>
          )}
        </aside>

        <div>
          {visible.length > 0 ? (
            <ProductGrid products={visible} />
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-fg-muted">No pieces match these filters.</p>
              <button
                type="button"
                onClick={() => updateParams({ category: null, color: null, material: null })}
                className={buttonStyles.secondary}
              >
                Show all pieces
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter panel. The native <dialog> traps focus, closes on Escape, and makes the page behind it inert. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="filters-title"
        onClose={() => {
          document.documentElement.style.overflow = "";
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-surface text-fg backdrop:bg-black/50"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 id="filters-title" className="text-2xl">
              Filters
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close filters"
              className={`inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-raised ${focusRing}`}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{filterGroups}</div>
          <div className="flex gap-3 border-t border-border px-4 py-4">
            <button type="button" onClick={clearFilters} className={`${buttonStyles.secondary} flex-1`}>
              Clear
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={`${buttonStyles.primary} flex-1`}
            >
              Show {pieces(visible.length)}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
