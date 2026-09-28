import { chapterParams } from "../../staticParams";

/** Prebuilds every spelling chapter of the world. See staticParams.ts. */
export async function generateStaticParams({ params }: { params: { stage: string } }) {
  return chapterParams(params.stage, "spelling");
}

export default function SpellingChapterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
