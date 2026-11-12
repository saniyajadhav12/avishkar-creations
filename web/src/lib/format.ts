const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats whole rupees in Indian style, e.g. 1250 → "₹1,250" */
export function formatPriceInr(amount: number): string {
  return inrFormatter.format(amount);
}

// Dates from Postgres are plain "YYYY-MM-DD" strings. Reading them as UTC and formatting in UTC
// means a date never shifts by a day because of the build machine's time zone.
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a date range, e.g. "12–14 Dec 2026", or a single date when start and end match */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  return start === end ? dateFormatter.format(startDate) : dateFormatter.formatRange(startDate, endDate);
}
