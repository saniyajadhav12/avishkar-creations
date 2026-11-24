"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { cardClass, errorClass, inputClass, labelClass, successClass } from "@/components/admin/form-styles";
import { ToggleSwitch } from "@/components/admin/toggle-switch";
import { buttonStyles } from "@/components/button-styles";
import { productFormSchema, type ProductFormField } from "@/lib/admin/product-schema";
import {
  deleteProduct,
  loadProductOptions,
  saveProduct,
  type AdminProductDetail,
  type ProductOptions,
} from "@/lib/admin/products";
import { slugify } from "@/lib/slug";

type ProductFormProps = {
  product?: AdminProductDetail;
  /** Shows a confirmation right after a new product was created */
  justCreated?: boolean;
};

const fieldOrder: ProductFormField[] = ["name", "slug", "price", "description"];
const legendClass = "font-sans text-xs font-medium tracking-[0.2em] text-fg-muted uppercase";

function chipClass(selected: boolean): string {
  return `inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line ${
    selected ? "border-primary bg-primary text-on-primary" : "border-fg/20 hover:border-primary"
  }`;
}

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export function ProductForm({ product, justCreated = false }: ProductFormProps) {
  const router = useRouter();
  const [options, setOptions] = useState<ProductOptions | null>(null);
  const [optionsError, setOptionsError] = useState("");

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.priceInr) : "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [colorIds, setColorIds] = useState(product?.colorIds ?? []);
  const [materialIds, setMaterialIds] = useState(product?.materialIds ?? []);
  const [isVisible, setIsVisible] = useState(product?.isVisible ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isSoldOut, setIsSoldOut] = useState(product?.isSoldOut ?? false);

  const [errors, setErrors] = useState<Partial<Record<ProductFormField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedMessage, setSavedMessage] = useState(justCreated ? "Product created. You can add photos below." : "");

  useEffect(() => {
    loadProductOptions()
      .then(setOptions)
      .catch(() => setOptionsError("Couldn't load categories, colours, and materials. Please refresh."));
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    // The web address follows the name until it's edited by hand
    if (!slugEdited) setSlug(slugify(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedMessage("");
    setFormError("");

    const parsed = productFormSchema.safeParse({ name, slug, description, price });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<ProductFormField, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as ProductFormField;
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      const first = fieldOrder.find((field) => fieldErrors[field]);
      if (first) document.getElementById(`product-${first}`)?.focus();
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const result = await saveProduct(
        {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          priceInr: parsed.data.price,
          categoryId: categoryId || null,
          colorIds,
          materialIds,
          isVisible,
          isFeatured,
          isSoldOut,
        },
        product?.id,
      );

      if (!product) {
        router.replace(`/admin/products/edit?id=${result.id}&created=1`);
        return;
      }
      setSlug(result.slug);
      setSavedMessage("Saved. Tap “Publish changes” on the Dashboard to update the live site.");
    } catch (error) {
      if (isUniqueViolation(error)) {
        setErrors({ slug: "That web address is already used by another product." });
      } else {
        setFormError("Couldn't save. Check your internet connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    const confirmed = window.confirm(`Delete “${product.name}”? Its photos will be deleted too. This can't be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteProduct(product.id);
      router.replace("/admin/products");
    } catch {
      setFormError("Couldn't delete this product. Please try again.");
      setDeleting(false);
    }
  }

  function fieldProps(field: ProductFormField) {
    return {
      id: `product-${field}`,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? `product-${field}-error` : undefined,
    };
  }

  function fieldError(field: ProductFormField) {
    return errors[field] ? (
      <p id={`product-${field}-error`} className={errorClass}>
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {savedMessage && (
        <p role="status" className={successClass}>
          {savedMessage}
        </p>
      )}

      <section className={`${cardClass} flex flex-col gap-5`}>
        <h2 className="text-2xl">Details</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="product-name" className={labelClass}>
            Name
          </label>
          <input
            {...fieldProps("name")}
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            maxLength={120}
            className={inputClass}
          />
          {fieldError("name")}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="product-slug" className={labelClass}>
            Web address
          </label>
          <input
            {...fieldProps("slug")}
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(event.target.value.toLowerCase());
            }}
            maxLength={80}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={inputClass}
          />
          <p className="text-xs text-fg-muted">The page will be at /shop/{slug || "…"}</p>
          {fieldError("slug")}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="product-price" className={labelClass}>
            Price (₹)
          </label>
          <input
            {...fieldProps("price")}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="numeric"
            placeholder="1250"
            className={inputClass}
          />
          {fieldError("price")}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="product-category" className={labelClass}>
            Category
          </label>
          <select
            id="product-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={inputClass}
          >
            <option value="">No category</option>
            {options?.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="product-description" className={labelClass}>
            Description
          </label>
          <textarea
            {...fieldProps("description")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            maxLength={2000}
            className={`${inputClass} py-3`}
          />
          {fieldError("description")}
        </div>
      </section>

      <section className={`${cardClass} flex flex-col gap-6`}>
        <h2 className="text-2xl">Colours &amp; materials</h2>
        {optionsError && <p className={errorClass}>{optionsError}</p>}
        {!options && !optionsError && <p className="text-sm text-fg-muted">Loading…</p>}

        {options && (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className={`${legendClass} mb-3`}>Colour</legend>
              <div className="flex flex-wrap gap-2">
                {options.colors.map((color) => {
                  const selected = colorIds.includes(color.id);
                  return (
                    <button
                      key={color.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setColorIds((ids) => toggleId(ids, color.id))}
                      className={chipClass(selected)}
                    >
                      <span
                        aria-hidden="true"
                        className="size-4 rounded-full border border-border"
                        style={{ backgroundColor: color.hex }}
                      />
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className={`${legendClass} mb-3`}>Material</legend>
              <div className="flex flex-wrap gap-2">
                {options.materials.map((material) => {
                  const selected = materialIds.includes(material.id);
                  return (
                    <button
                      key={material.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setMaterialIds((ids) => toggleId(ids, material.id))}
                      className={chipClass(selected)}
                    >
                      {material.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}
      </section>

      <section className={`${cardClass} flex flex-col gap-2`}>
        <h2 className="mb-2 text-2xl">On the website</h2>
        <ToggleSwitch label="Visible in the shop" checked={isVisible} onChange={setIsVisible} />
        <ToggleSwitch label="Featured on the home page" checked={isFeatured} onChange={setIsFeatured} />
        <ToggleSwitch label="Sold out" checked={isSoldOut} onChange={setIsSoldOut} />
      </section>

      {!product && (
        <p className="text-sm text-fg-muted">You can add photos after saving the product for the first time.</p>
      )}

      {formError && (
        <p role="alert" className={errorClass}>
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving || deleting} className={`${buttonStyles.primary} disabled:opacity-60`}>
          {saving ? "Saving…" : product ? "Save changes" : "Save product"}
        </button>
        <Link href="/admin/products" className={buttonStyles.secondary}>
          Back to products
        </Link>
      </div>

      {product && (
        <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-badge/40 p-6">
          <h2 className="text-2xl">Delete product</h2>
          <p className="text-sm text-fg-muted">
            Deletes this product and its photos. To hide it for now instead, switch off “Visible in the shop.”
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="inline-flex min-h-12 items-center self-start rounded-full bg-badge px-7 text-sm font-medium text-on-badge disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete product"}
          </button>
        </section>
      )}
    </form>
  );
}
