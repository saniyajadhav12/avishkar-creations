import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `next build` writes plain HTML/CSS/JS to ./out,
  // served from Cloudflare's CDN with no server or database needed at request time.
  output: "export",

  // Each route becomes a folder with index.html (e.g. /about/index.html).
  trailingSlash: true,

  images: {
    // The built-in optimizer needs a server; we generate WebP sizes with sharp at build time.
    unoptimized: true,
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
