// 콘텐츠 페이지 목록. 글은 페이지별 파일에 한국어·영어를 함께 둡니다.
// 사실과 다른 내용을 쓰지 않도록, 도구의 동작이 바뀌면 이 글도 함께 고쳐 주세요.
import { about } from "./about.ts";
import { contact } from "./contact.ts";
import { privacy } from "./privacy.ts";
import { terms } from "./terms.ts";
import { guide } from "./guide.ts";
import { formats } from "./formats.ts";
import { example } from "./example.ts";
import { findParts } from "./find-parts.ts";
import { readSchematic } from "./read-schematic.ts";
import { faq } from "./faq.ts";

export type Lang = "ko" | "en";

/** what a page's text may depend on */
export interface Ctx {
  lang: Lang;
  /** link to another content page in the same language */
  href: (slug: string) => string;
  /** link into the tool in the same language ("#viewer" by default, "#example" opens the sample) */
  tool: (hash?: string) => string;
  /** public contact address from site.config.json ("" when not set yet) */
  email: string;
  /** GA4 is configured (the privacy text changes with it) */
  analytics: boolean;
  /** date shown as "last updated" */
  updated: string;
}

export interface PageContent {
  title: string;
  description: string;
  /** optional lead paragraph (HTML); the description is used when absent */
  lead?: string;
  /** article body (HTML) */
  body: string;
}

export interface PageDef {
  slug: string;
  related?: string[];
  /** show the "open the tool" box under the article (default true) */
  cta?: boolean;
  content: (ctx: Ctx) => PageContent;
}

export const pages: PageDef[] = [guide, formats, example, findParts, readSchematic, faq, about, contact, privacy, terms];
