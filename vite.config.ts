import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/ayamonteapie/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "AYAMONTE A PIE",
        short_name: "AyamontePie",
        description: "Rutas y caminatas por Ayamonte (Huelva)",
        theme_color: "#2e7d5b",
        background_color: "#f4f7f5",
        display: "standalone",
        orientation: "portrait",
        start_url: "/ayamonteapie/",
        scope: "/ayamonteapie/",
        lang: "es",
        icons: [
          { src: "/ayamonteapie/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/ayamonteapie/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/ayamonteapie/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});