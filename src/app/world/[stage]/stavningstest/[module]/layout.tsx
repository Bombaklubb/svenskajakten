import { chapterParams } from "../../staticParams";

/** Prebuilds every stavningstest chapter of the world. See staticParams.ts. */
export async function generateStaticParams({ params }: { params: { stage: string } }) {
  return chapterParams(params.stage, "stavningstest");
}

export default function StavningstestChapterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
