import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   manifest: {
    //     name: "Nestlé CommHub",
    //     short_name: "CommHub",
    //     description:
    //       "Centralized communication platform for Nestlé Sri Lanka supply chain operations.",
    //     theme_color: "#3D2B1F",
    //     background_color: "#ffffff",
    //     display: "standalone",
    //     start_url: "/",
    //     icons: [
    //       {
    //         src: "/pwa-192x192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //     ],
    //   },
    // }),
  ],
});
