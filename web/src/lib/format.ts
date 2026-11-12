const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats whole rupees in Indian style, e.g. 1250 → "₹1,250" */
export function formatPriceInr(amount: number): string {
  return inrFormatter.format(amount);
}
