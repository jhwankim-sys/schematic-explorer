// 일본어 글 목록. 한국어 원문(../*.ts)을 옮긴 것이며 원어민 검수는 아직 받지 않았습니다.
// 원문의 사실·조건·부정·수치를 그대로 옮기고, 원문에 없는 약속을 더하지 않습니다.
// 원문이 바뀌면 이 번역도 함께 고치고 updated 를 그날로 바꿉니다(한·영 날짜와 따로 관리).
import type { Ctx, PageContent } from "../index.ts";
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
import { changelog } from "./changelog.ts";

export interface JaPage {
  /** YYYY-MM-DD the Japanese text was written or last changed (shown as 最終更新, sitemap lastmod) */
  updated: string;
  content: (ctx: Ctx) => PageContent;
}

/** by slug, the same slugs as ../index.ts */
export const jaPages: Record<string, JaPage> = {
  guide,
  "help/formats": formats,
  "learn/example": example,
  "learn/find-parts": findParts,
  "learn/read-schematic": readSchematic,
  faq,
  about,
  contact,
  privacy,
  terms,
  changelog,
};
