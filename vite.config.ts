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
  // the analysis worker (src/lib/schematic/analyze-worker.ts) loads pdf.js with a dynamic import,
  // which needs an ES module worker bundle (the default "iife" cannot split chunks)
  worker: { format: "es" },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
