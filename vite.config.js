import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { bleedErrorPage, fetchBleedDocument } from "./netlify/functions/_shared/bleed-proxy.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function bleedProxy() {
  return {
    name: "bleed-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
        if (requestUrl.pathname !== "/api/bleed") return next();
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        try {
          const result = await fetchBleedDocument(requestUrl.searchParams.get("url"));
          res.statusCode = result.status;
          res.setHeader("Content-Type", result.contentType);
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Referrer-Policy", "no-referrer");
          res.end(req.method === "HEAD" ? undefined : result.body);
        } catch (error) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(bleedErrorPage(error.message || "Bleed could not open that page."));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    bleedProxy(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192x192.png", "apple-touch-icon.png", "cancer-zodiac.svg"],
      manifest: {
        id: "/",
        name: "Thar Htet Zan — UI/UX Designer",
        short_name: "Thar Htet Zan",
        description:
          "Thar Htet Zan is a UI/UX designer and frontend developer in Yangon. Design systems, React interfaces, and the work behind them.",
        theme_color: "#111111",
        background_color: "#111111",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,webmanifest}"],
        globIgnores: ["**/assets/**/*.png", "**/*.wasm"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    watch: {
      ignored: ["**/src/assets/musics/**", "**/store/**/*.{mp3,wav,ogg}"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
});
