// Build-time render of the Korean landing page (#home) to static HTML, put into dist/index.html by
// scripts/pages/build.ts, so the page has its text and links before (and without) JavaScript.
// It is the same component the browser renders, so both show the same content; the browser replaces
// this HTML on its first render. The workspace (the tool itself) is not part of it.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { LanguageContext } from "./i18n.tsx";
import { WebsiteContent } from "./site.tsx";

export function renderHome(): string {
  return renderToString(
    <StrictMode>
      <LanguageContext value="ko">
        <WebsiteContent language="ko" onLanguage={() => {}} prerender />
      </LanguageContext>
    </StrictMode>,
  );
}
