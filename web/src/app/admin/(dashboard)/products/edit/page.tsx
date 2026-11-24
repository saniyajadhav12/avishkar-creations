"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { errorClass } from "@/components/admin/form-styles";
import { ProductForm } from "@/components/admin/product-form";
import { ProductPhotos } from "@/components/admin/product-photos";
import { getAdminProduct, type AdminProductDetail } from "@/lib/admin/products";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; product: AdminProductDetail }
  | { status: "not-found" }
  | { status: "error" };

function EditProduct() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const justCreated = searchParams.get("created") === "1";
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!id) return;
    getAdminProduct(id)
      .then((product) => setState(product ? { status: "ready", product } : { status: "not-found" }))
      .catch(() => setState({ status: "error" }));
  }, [id]);

  if (!id || state.status === "not-found") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted">This product doesn&apos;t exist. It may have been deleted.</p>
        <Link href="/admin/products" className="text-primary underline">
          Back to products
        </Link>
      </div>
    );
  }
  if (state.status === "error") {
    return <p className={errorClass}>Couldn&apos;t load this product. Check your internet connection and refresh.</p>;
  }
  if (state.status === "loading") return <p className="text-fg-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <ProductPhotos productId={state.product.id} productName={state.product.name} />
      <ProductForm key={state.product.id} product={state.product} justCreated={justCreated} />
    </div>
  );
}

// Product IDs aren't known at build time, so the edit page reads ?id= in the browser.
// Reading the URL needs a Suspense boundary in a static export.
export default function EditProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">Edit product</h1>
      <Suspense fallback={<p className="text-fg-muted">Loading…</p>}>
        <EditProduct />
      </Suspense>
    </div>
  );
}
