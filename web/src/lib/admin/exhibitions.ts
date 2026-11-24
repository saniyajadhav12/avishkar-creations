import { z } from "zod";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const rowSchema = z.object({
  id: z.string(),
  title: z.string(),
  venue: z.string(),
  city: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  notes: z.string(),
});

const COLUMNS = "id, title, venue, city, start_date, end_date, notes";

export type AdminExhibition = {
  id: string;
  title: string;
  venue: string;
  city: string;
  startDate: string;
  endDate: string;
  notes: string;
};

export type ExhibitionInput = Omit<AdminExhibition, "id">;

function toExhibition(row: z.infer<typeof rowSchema>): AdminExhibition {
  return {
    id: row.id,
    title: row.title,
    venue: row.venue,
    city: row.city,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
  };
}

/** Admins see past exhibitions too (the public only sees upcoming ones) */
export async function listExhibitions(): Promise<AdminExhibition[]> {
  const { data, error } = await getBrowserSupabase().from("exhibitions").select(COLUMNS).order("start_date");
  if (error) throw error;
  return z.array(rowSchema).parse(data).map(toExhibition);
}

export async function saveExhibition(input: ExhibitionInput, id?: string): Promise<AdminExhibition> {
  const row = {
    title: input.title,
    venue: input.venue,
    city: input.city,
    start_date: input.startDate,
    end_date: input.endDate,
    notes: input.notes,
  };
  const supabase = getBrowserSupabase();
  const query = id
    ? supabase.from("exhibitions").update(row).eq("id", id).select(COLUMNS).single()
    : supabase.from("exhibitions").insert(row).select(COLUMNS).single();
  const { data, error } = await query;
  if (error) throw error;
  return toExhibition(rowSchema.parse(data));
}

export async function deleteExhibition(id: string): Promise<void> {
  const { error } = await getBrowserSupabase().from("exhibitions").delete().eq("id", id);
  if (error) throw error;
}
