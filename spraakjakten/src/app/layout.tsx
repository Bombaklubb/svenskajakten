import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Språkjakten – Lär dig franska, spanska & tyska",
  description:
    "En gratis språkträningsapp för franska, spanska och tyska. Övningar i ordförråd och grammatik i tre spännande världar.",
  keywords: ["franska", "spanska", "tyska", "språk", "skola", "övningar", "grammatik", "ordförråd", "gratis"],
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
        {children}
        <div className="fixed bottom-2 left-3 z-40 pointer-events-none select-none">
          <span className="text-xs text-slate-400 dark:text-slate-600 opacity-60 hover:opacity-100 transition-opacity pointer-events-auto">
            Kontakt: martin.akdogan@enkoping.se
          </span>
        </div>
        <div className="fixed bottom-2 right-3 z-40 pointer-events-none select-none">
          <span className="text-xs text-slate-400 dark:text-slate-600 opacity-60 hover:opacity-100 transition-opacity">
            Språkjakten av Martin Akdogan
          </span>
        </div>
      </body>
    </html>
  );
}
