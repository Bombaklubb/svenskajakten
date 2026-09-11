import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionTracker from "@/components/ui/SessionTracker";
import JaktlankarMenu from "@/components/ui/JaktlankarMenu";
import ContactCorner from "@/components/ui/ContactCorner";

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
    <html lang="sv" suppressHydrationWarning>
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
