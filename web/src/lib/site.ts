/**
 * Brand details and navigation, kept in one place so they're never hard-coded across components.
 */

// WhatsApp number with country code, from NEXT_PUBLIC_WHATSAPP_NUMBER (e.g. 919876543210 or +91 98765 43210).
// Set it in web/.env.local for local testing and in Cloudflare Pages for the live site, so a test
// number never ends up in the public repo. Until it's set, "message us" links open Instagram DMs instead.
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export const site = {
  name: "Avishkar Creations",
  nameMarathi: "आविष्कार",
  founder: "Kavita Jadhav",
  location: "Pune, Maharashtra",
  tagline: "Handmade jewellery, one of a kind, made with love.",
  description:
    "Handmade jewellery by Kavita Jadhav in Pune: pearl strands, beaded necklaces, temple and kundan pendants, oxidised silver, and matching earrings.",
  // The live address. When the .com domain is connected, this is the only line to change.
  url: "https://avishkar-creations.pages.dev",
  instagramHandle: "avishkar_creations",
  instagramUrl: "https://www.instagram.com/avishkar_creations/",
  whatsappNumber: WHATSAPP_NUMBER,
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Where "message us" buttons point: WhatsApp once the number is set, Instagram DMs until then.
 * An optional prefilled message is only supported by WhatsApp.
 */
export function contactLink(message?: string): { href: string; label: string } {
  if (site.whatsappNumber) {
    const text = message ? `?text=${encodeURIComponent(message)}` : "";
    return { href: `https://wa.me/${site.whatsappNumber}${text}`, label: "Message on WhatsApp" };
  }

  return { href: `https://ig.me/m/${site.instagramHandle}`, label: "Message on Instagram" };
}
