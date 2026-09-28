import { chapterParams } from "../../staticParams";

/** Prebuilds every wordsearch chapter of the world. See staticParams.ts. */
export async function generateStaticParams({ params }: { params: { stage: string } }) {
  return chapterParams(params.stage, "wordsearch");
}

export default function WordsearchChapterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
