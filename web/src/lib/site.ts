/**
 * Brand details and navigation, kept in one place so they're never hard-coded across components.
 */

// PRE-LAUNCH CHECKLIST: add the WhatsApp number as digits with country code, no + or spaces
// (e.g. "919876543210"). Until then, "message us" links open Instagram DMs instead.
const WHATSAPP_NUMBER: string = "";

export const site = {
  name: "Avishkar Creations",
  nameMarathi: "आविष्कार",
  founder: "Kavita Jadhav",
  location: "Pune, Maharashtra",
  tagline: "Handmade jewellery, one of a kind, made with love.",
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
