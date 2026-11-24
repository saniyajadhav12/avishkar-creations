"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { cardClass, errorClass, inputClass } from "@/components/admin/form-styles";
import { buttonStyles } from "@/components/button-styles";
import {
  deleteProductImage,
  listProductImages,
  saveImageOrder,
  updateImageAlt,
  uploadProductImage,
  type AdminProductImage,
} from "@/lib/admin/product-images";

type ProductPhotosProps = {
  productId: string;
  productName: string;
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-line";

function SmallButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex size-11 items-center justify-center rounded-full border border-fg/20 text-lg hover:border-primary disabled:opacity-40 ${focusRing}`}
    >
      {children}
    </button>
  );
}

/**
 * Photos for one product: upload (camera or gallery), reorder, describe, and delete.
 * The first photo is the main one on the shop and product pages.
 */
export function ProductPhotos({ productId, productName }: ProductPhotosProps) {
  const [images, setImages] = useState<AdminProductImage[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    listProductImages(productId)
      .then(setImages)
      .catch(() => setLoadError("Couldn't load photos. Check your internet connection and refresh."));
  }, [productId]);

  async function reload() {
    try {
      setImages(await listProductImages(productId));
    } catch {
      setLoadError("Couldn't load photos. Please refresh.");
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow choosing the same photo again later
    if (files.length === 0) return;

    setErrors([]);
    const failures: string[] = [];
    let nextOrder = images?.length ?? 0;

    for (const [index, file] of files.entries()) {
      setBusy(`Uploading photo ${index + 1} of ${files.length}…`);
      try {
        const image = await uploadProductImage(productId, file, productName, nextOrder);
        nextOrder += 1;
        setImages((current) => [...(current ?? []), image]);
      } catch {
        failures.push(`“${file.name}” couldn't be uploaded. Please try again, or use a JPEG or PNG photo.`);
      }
    }

    setBusy(null);
    setErrors(failures);
  }

  async function move(index: number, offset: -1 | 1) {
    if (!images) return;
    const target = index + offset;
    if (target < 0 || target >= images.length) return;

    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setImages(reordered);
    setErrors([]);
    try {
      await saveImageOrder(reordered);
    } catch {
      setErrors(["Couldn't save the new order. Please try again."]);
      await reload();
    }
  }

  async function remove(image: AdminProductImage, position: number) {
    if (!window.confirm(`Delete photo ${position}? This can't be undone.`)) return;
    setBusy("Deleting photo…");
    setErrors([]);
    try {
      await deleteProductImage(image);
      const remaining = (images ?? []).filter((item) => item.id !== image.id);
      setImages(remaining);
      await saveImageOrder(remaining);
    } catch {
      setErrors(["Couldn't delete that photo. Please try again."]);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  function editAlt(id: string, altText: string) {
    setImages((current) => current?.map((image) => (image.id === id ? { ...image, altText } : image)) ?? current);
  }

  async function saveAlt(image: AdminProductImage) {
    try {
      await updateImageAlt(image.id, image.altText.trim() || productName);
    } catch {
      setErrors(["Couldn't save the photo description. Please try again."]);
    }
  }

  const disabled = busy !== null;

  return (
    <section className={`${cardClass} flex flex-col gap-5`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl">Photos</h2>
        <p className="text-sm text-fg-muted">
          The first photo is the main one in the shop. Photos are made smaller before uploading, to save mobile data.
        </p>
      </div>

      {loadError && (
        <p role="alert" className={errorClass}>
          {loadError}
        </p>
      )}
      {!images && !loadError && <p className="text-sm text-fg-muted">Loading photos…</p>}
      {images && images.length === 0 && <p className="text-sm text-fg-muted">No photos yet.</p>}

      {images && images.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="flex flex-col gap-2">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview straight from Supabase Storage */}
                <img src={image.url} alt={image.altText} className="aspect-square w-full rounded-xl object-cover" />
                {index === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-0.5 text-xs text-on-primary">
                    Main photo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <SmallButton
                  label={`Move photo ${index + 1} earlier`}
                  onClick={() => move(index, -1)}
                  disabled={disabled || index === 0}
                >
                  ←
                </SmallButton>
                <SmallButton
                  label={`Move photo ${index + 1} later`}
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === images.length - 1}
                >
                  →
                </SmallButton>
                <button
                  type="button"
                  onClick={() => remove(image, index + 1)}
                  disabled={disabled}
                  className={`ml-auto inline-flex min-h-11 items-center rounded-full px-3 text-sm text-badge hover:underline disabled:opacity-40 ${focusRing}`}
                >
                  Delete
                </button>
              </div>
              <label htmlFor={`alt-${image.id}`} className="text-xs text-fg-muted">
                Photo description
              </label>
              <input
                id={`alt-${image.id}`}
                value={image.altText}
                onChange={(event) => editAlt(image.id, event.target.value)}
                onBlur={() => saveAlt(image)}
                maxLength={200}
                className={`${inputClass} min-h-11 text-sm`}
              />
            </li>
          ))}
        </ul>
      )}

      {busy && (
        <p role="status" className="text-sm text-fg-muted">
          {busy}
        </p>
      )}
      {errors.map((message) => (
        <p key={message} role="alert" className={errorClass}>
          {message}
        </p>
      ))}

      {/* The real file input is visually hidden; the label looks like a button. On phones, accept="image/*"
          offers both the camera and the photo gallery. */}
      <label
        className={`${buttonStyles.primary} cursor-pointer self-start focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-line ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={disabled} className="sr-only" />
        + Add photos
      </label>
      <p className="-mt-2 text-xs text-fg-muted">On your phone, you can take a new photo or choose from your gallery.</p>
    </section>
  );
}
