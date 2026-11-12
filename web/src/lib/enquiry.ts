import { z } from "zod";

// Mirrors the CHECK constraints on public.enquiries, so anything the form accepts,
// the database accepts too (and the database still enforces them if the form is bypassed).
const phonePattern = /^\+?[0-9 ()-]{7,20}$/;
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const enquirySchema = z
  .object({
    name: z.string().trim().min(1, "Please enter your name.").max(100, "Please keep your name under 100 characters."),
    phone: z
      .string()
      .trim()
      .refine((value) => value === "" || phonePattern.test(value), "Please enter a valid phone number, e.g. +91 98765 43210."),
    email: z
      .string()
      .trim()
      .max(254, "That email address is too long.")
      .refine((value) => value === "" || emailPattern.test(value), "Please enter a valid email address."),
    message: z
      .string()
      .trim()
      .min(1, "Please write a message.")
      .max(2000, "Please keep your message under 2,000 characters."),
  })
  .refine((data) => data.phone !== "" || data.email !== "", {
    message: "Please share a phone number or email so Kavita can reply.",
    path: ["phone"],
  });

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquiryField = keyof EnquiryInput;
