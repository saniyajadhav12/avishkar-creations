import { z } from "zod";

// Mirrors the CHECK constraints on public.products
export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Please enter a name.").max(120, "Please keep the name under 120 characters."),
  slug: z
    .string()
    .trim()
    .min(1, "Please enter a web address.")
    .max(80, "Please keep the web address under 80 characters.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens, e.g. pearl-mangalsutra."),
  description: z.string().trim().max(2000, "Please keep the description under 2,000 characters."),
  price: z
    .string()
    .transform((value) => value.replace(/[\s,₹]/g, ""))
    .pipe(z.string().regex(/^\d+$/, "Please enter the price in whole rupees, e.g. 1250."))
    .transform(Number)
    .pipe(z.number().int().max(1_000_000, "That price looks too high. Please check it.")),
});

export type ProductFormField = keyof z.input<typeof productFormSchema>;
