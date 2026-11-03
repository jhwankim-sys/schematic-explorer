import "./lib/polyfills.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Website } from "./site.tsx";

// The built index.html carries the Korean landing page as static HTML (prerender.tsx) so it can be read
// before this script runs; the app replaces it on its first render (createRoot, not hydration).
createRoot(document.getElementById("root")!).render(<StrictMode><Website /></StrictMode>);
