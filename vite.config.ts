import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// base: "./" lets the built `dist/` folder be served from any sub-path
// (e.g. https://www.example.com/tools/schematic/).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  // pdf.js is large (~1.7MB, loaded once and cached); silence the size warning
  build: { chunkSizeWarningLimit: 2000 },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
