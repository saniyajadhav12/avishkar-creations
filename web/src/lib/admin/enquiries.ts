import { z } from "zod";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  message: z.string(),
  created_at: z.string(),
});

export type AdminEnquiry = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  createdAt: string;
};

export async function listEnquiries(): Promise<AdminEnquiry[]> {
  const { data, error } = await getBrowserSupabase()
    .from("enquiries")
    .select("id, name, phone, email, message, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return z
    .array(rowSchema)
    .parse(data)
    .map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      message: row.message,
      createdAt: row.created_at,
    }));
}

export async function deleteEnquiry(id: string): Promise<void> {
  const { error } = await getBrowserSupabase().from("enquiries").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Digits for a wa.me link. A 10-digit number (or one starting with 0) is treated as Indian
 * and gets the 91 country code, so "98765 43210" and "+91 98765 43210" both work.
 */
export function whatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}
