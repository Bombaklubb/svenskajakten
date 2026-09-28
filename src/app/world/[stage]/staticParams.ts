/**
 * Build-time lists of the worlds and their chapters, so every /world/… page is
 * generated once at build and served as a static file instead of being
 * rendered on each visit. Server-side only (reads from disk at build time).
 *
 * The pages themselves are client components; the small layout.tsx files next
 * to them exist only to export generateStaticParams, which a "use client" page
 * cannot. A chapter added without a rebuild still works: dynamicParams is left
 * at its default, so an unknown id is rendered on demand.
 */
import { readFileSync } from "fs";
import path from "path";
import { STAGES } from "@/lib/stages";

type ChapterKind = "grammar" | "spelling" | "wordsearch" | "stavningstest";

export function stageParams(): { stage: string }[] {
  return STAGES.map((s) => ({ stage: s.id }));
}

/** The chapter ids of one kind in one world, read from its content.json. */
export function chapterParams(stage: string, kind: ChapterKind): { module: string }[] {
  try {
    const file = path.join(process.cwd(), "public", "content", stage, "content.json");
    const content = JSON.parse(readFileSync(file, "utf-8")) as Partial<Record<ChapterKind, { id: string }[]>>;
    return (content[kind] ?? []).map((m) => ({ module: m.id }));
  } catch {
    // No list, no prebuilt pages: they are then rendered on demand instead.
    return [];
  }
}
