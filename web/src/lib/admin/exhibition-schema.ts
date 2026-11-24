import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// Mirrors the CHECK constraints on public.exhibitions
export const exhibitionFormSchema = z
  .object({
    title: z.string().trim().min(1, "Please enter a title.").max(120, "Please keep the title under 120 characters."),
    venue: z.string().trim().min(1, "Please enter the venue.").max(120, "Please keep the venue under 120 characters."),
    city: z.string().trim().min(1, "Please enter the city.").max(60, "Please keep the city under 60 characters."),
    startDate: z.string().regex(datePattern, "Please choose a start date."),
    endDate: z.string().regex(datePattern, "Please choose an end date."),
    notes: z.string().trim().max(500, "Please keep the notes under 500 characters."),
  })
  // Dates are YYYY-MM-DD strings, so comparing them as text compares them by date
  .refine((data) => data.endDate >= data.startDate, {
    message: "The end date can't be before the start date.",
    path: ["endDate"],
  });

export type ExhibitionField = keyof z.input<typeof exhibitionFormSchema>;
