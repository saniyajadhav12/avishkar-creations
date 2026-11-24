/**
 * Turns a product name into a web address slug, e.g. "Red & Black Bracelet" → "red-and-black-bracelet".
 * Matches the database rule: lowercase letters and numbers separated by single hyphens.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}
