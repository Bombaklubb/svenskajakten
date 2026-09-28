import { stageParams } from "./staticParams";

/** Prebuilds the four worlds (and the game pages below them). See staticParams.ts. */
export function generateStaticParams() {
  return stageParams();
}

export default function StageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
