"use client";

import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">Add product</h1>
      <ProductForm />
    </div>
  );
}
