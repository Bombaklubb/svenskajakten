import { chapterParams } from "../../staticParams";

/** Prebuilds every grammar chapter of the world. See staticParams.ts. */
export async function generateStaticParams({ params }: { params: { stage: string } }) {
  return chapterParams(params.stage, "grammar");
}

export default function GrammarChapterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
