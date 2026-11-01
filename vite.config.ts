import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      includeAssets: ["icon.svg", "pink-sun-apple.png"],
      manifest: {
        name: "Daylight · 像素日程管家",
        short_name: "Daylight",
        id: "/",
        scope: "/",
        lang: "zh-CN",
        start_url: "/",
        display: "standalone",
        background_color: "#fff0f5",
        theme_color: "#fff0f5",
        icons: [
          { src: "/pink-sun-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/pink-sun-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pink-sun-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        importScripts: ["/push-events.js"],
        navigateFallbackDenylist: [/^\/\.netlify\//],
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
});
