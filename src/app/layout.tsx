import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";
import SessionTracker from "@/components/ui/SessionTracker";
import JaktlankarMenu from "@/components/ui/JaktlankarMenu";
import ContactCorner from "@/components/ui/ContactCorner";

/**
 * Baloo 2, self-hosted by Next.js: the files are fetched at build time and
 * served from our own domain, so a pupil's browser never talks to Google. The
 * CSS picks it up through --font-baloo (see globals.css). It is a variable
 * font, so one file covers every weight from 400 to 800.
 */
const baloo = Baloo_2({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-baloo",
});

/**
 * Applies the saved light/dark choice before the first paint. useDarkMode used
 * to do it only once Header had mounted, so every page flashed light first,
 * and pages without a Header (the login screen, /larare) ignored the choice.
 * Same key and fallback as useDarkMode.
 */
const DARK_MODE_SCRIPT = `try{var s=localStorage.getItem("darkMode");var d=s!==null?s==="true":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export const metadata: Metadata = {
  title: "Svenskajakten – Lär dig svenska",
  description:
    "En gratis svenskträningsapp för Nivå 1–10. Grammatikövningar och läsförståelse i fyra spännande världar.",
  keywords: ["svenska", "skola", "övningar", "grammatik", "läsförståelse", "gratis"],
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={baloo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: DARK_MODE_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <SessionTracker />
        {children}
        <div className="fixed bottom-2 left-3 z-40 pointer-events-none select-none">
          <ContactCorner />
        </div>
        <div className="fixed bottom-2 right-3 z-40 pointer-events-auto select-none">
          <JaktlankarMenu />
        </div>
      </body>
    </html>
  );
}
