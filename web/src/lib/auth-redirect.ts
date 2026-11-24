/**
 * Where to send someone after signing in. Only pages on this site are allowed (never another
 * site, and never the admin area), so a crafted ?next= link can't redirect people elsewhere.
 * Paths get a trailing slash to match the static export's URLs.
 */
export function safeNext(next: string | null, fallback = "/account/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/admin")) return fallback;
  const [path, query] = next.split("?");
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return query ? `${normalized}?${query}` : normalized;
}
