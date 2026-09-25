import type { NextConfig } from "next";

/**
 * Vercel skickar filerna i public/ med "max-age=0, must-revalidate", så
 * webbläsaren frågar om varje bild och innehållsfil vid varje sidbesök. Varje
 * sådan fråga räknas som ett anrop mot teamets gemensamma tak, även när svaret
 * bara är "oförändrad". Här får webbläsaren behålla dem en stund i stället.
 *
 * Innehållsfilerna ändras när kapitel läggs till, så de hålls en timme och
 * förnyas sedan i bakgrunden. Bilderna byts nästan aldrig och hålls ett dygn.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:all*(png|jpg|jpeg|webp|gif|svg|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/content/:all*(json)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      // Last, because when two rules set the same header the later one wins.
      {
        // The sprite sheet's name carries a hash of its content, so a new
        // sheet gets a new name and the old one can be kept for good.
        source: "/sprites/:all*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
