export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "avishkar-theme";

/**
 * Runs inline in <head> before the page paints, so a static page never flashes the wrong theme.
 * Order of preference: the visitor's saved choice, then their device setting.
 */
export const themeInitScript = `(function () {
  try {
    var saved = localStorage.getItem("${THEME_STORAGE_KEY}");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = saved === "light" || saved === "dark" ? saved : prefersDark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();`;
