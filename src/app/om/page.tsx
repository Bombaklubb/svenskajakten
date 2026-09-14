"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { STAGES } from "@/lib/stages";
import { CHEST_META } from "@/lib/gamification";
import { MAX_LEVEL } from "@/lib/levels";
import type { StudentData, ChestType } from "@/lib/types";

// ─── Om Svenskajakten ────────────────────────────────────────────────────────
// Förklarar appen för elever, vårdnadshavare och kollegor. Siffrorna här är
// hämtade ur koden och innehållet (poäng, kistor, priser, nivåer). Ändras något
// av dem bör texten här uppdateras också.

const OVNINGSTYPER = [
  {
    emoji: "🅰️",
    name: "Välj rätt svar",
    desc: "Två till fyra alternativ där ett är rätt. Efter svaret kommer en förklaring till varför.",
  },
  {
    emoji: "✏️",
    name: "Fyll i luckan",
    desc: "Skriv ordet eller tecknet som fattas. Stor bokstav, extra mellanslag och en punkt på slutet spelar ingen roll – utom i övningar där just det är poängen.",
  },
  {
    emoji: "🧩",
    name: "Bygg meningen",
    desc: "Klicka ihop orden till en riktig mening. Går meningen att säga på fler än ett sätt godkänns båda.",
  },
  {
    emoji: "🔎",
    name: "Kluringar",
    desc: "Tre ledtrådar pekar mot ett ord. Vilket är det?",
  },
  {
    emoji: "🔊",
    name: "Lyssna och stava",
    desc: "Appen läser upp ordet. Du skriver det.",
  },
];

const AKTIVITETER = [
  { emoji: "📝", name: "Grammatik", desc: "Appens kärna. 111 kapitel – från alfabetet och stor bokstav till satsdelar, retorik och litteraturhistoria." },
  { emoji: "✏️", name: "Stavning", desc: "Ord som ofta blir fel. Här finns också stavningstest på tid: sextio sekunder och alla rätt krävs." },
  { emoji: "📐", name: "Språkregler", desc: "Uppslagsdelen. Reglerna förklarade med exempel – bra att titta i före eller under ett kapitel." },
  { emoji: "🔍", name: "Ordsökning", desc: "Hitta gömda ord i rutnätet. Lugnare träning på ordbilder." },
  { emoji: "🎮", name: "Spel", desc: "Memory, Snögubben, Tidsattack och Samla mynt. Alla ger riktiga poäng." },
  { emoji: "🔁", name: "Försök igen", desc: "Allt du svarat fel på samlas här. Rätta ett gammalt fel och det försvinner ur listan." },
];

const SPEL = [
  { emoji: "🃏", name: "Memory", desc: "Para ihop begrepp med förklaring. Lätt, Medel eller Svår." },
  { emoji: "⛄", name: "Snögubben", desc: "Gissa ordet bokstav för bokstav. Sex liv – varje fel smälter snögubben lite." },
  { emoji: "⏱️", name: "Tidsattack", desc: "Sextio sekunder. Hur många frågor hinner du svara rätt på?" },
  { emoji: "🪙", name: "Samla mynt", desc: "Spring och samla mynt genom att svara rätt. Tre hinder och loppet är slut." },
];

// Kistorna i den ordning de delas ut, med appens egna bilder.
const KISTOR: { type: ChestType; points: string }[] = [
  { type: "wood",    points: "20–120 poäng" },
  { type: "silver",  points: "20–120 poäng + märke" },
  { type: "gold",    points: "20–120 poäng + märke" },
  { type: "emerald", points: "20–120 poäng + märke" },
  { type: "ruby",    points: "20–120 poäng + märke" },
  { type: "diamond", points: "20–120 poäng + märke" },
  { type: "hemlig",  points: "100–300 poäng" },
];

function Section({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="flex items-center gap-2.5 text-lg font-black text-sv-900 dark:text-gray-100 mb-4">
        <span className="text-2xl" aria-hidden="true">{emoji}</span>
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </section>
  );
}

export default function OmPage() {
  const [student, setStudent] = useState<StudentData | null>(null);
  useEffect(() => { setStudent(loadStudent()); }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header student={student} />

      {/* Banner */}
      <div
        className="text-white"
        style={{ background: "linear-gradient(135deg, #7c2d12, #c2570a, #f97316)" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/75 hover:text-white text-sm mb-3 transition-colors"
          >
            ← Tillbaka
          </Link>
          <div className="flex items-center gap-3">
            <svg width="44" height="44" viewBox="0 0 40 40" className="rounded-xl border-2 border-white/30" aria-hidden="true">
              <rect width="40" height="40" fill="#006AA7" />
              <rect y="15" width="40" height="10" fill="#FECC02" />
              <rect x="13" y="0" width="10" height="40" fill="#FECC02" />
            </svg>
            <div>
              <h1 className="text-2xl font-black">Om Svenskajakten</h1>
              <p className="text-white/80 text-sm">Så fungerar appen</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        <Section emoji="🎯" title="Vad är Svenskajakten?">
          <p>
            Svenskajakten tränar <strong>svensk grammatik, stavning och språkriktighet</strong>. Du
            väljer en värld, öppnar ett kapitel och svarar på övningarna. Varje svar rättas direkt och
            du får veta varför det blev rätt eller fel.
          </p>
          <p>
            Appen är gratis, kräver inget konto och fungerar i webbläsaren på Chromebook, dator,
            surfplatta och mobil.
          </p>
          <p className="text-sm">
            Det finns systerappar för andra ämnen: <strong>Läsjakten</strong>, <strong>Mattejakten</strong>,{" "}
            <strong>Engelskajakten</strong> och <strong>Readhunt</strong>. De når du via Jaktlänkar nere
            till höger.
          </p>
        </Section>

        <Section emoji="🚀" title="Kom igång">
          <ol className="space-y-2.5">
            {[
              ["Skriv ditt namn", "Välj en figur och skriv ett namn. Nästa gång du skriver samma namn hittar appen dina poäng igen."],
              ["Välj värld", "Ordängen är lättast, Skrivakademin svårast. Du väljer fritt och kan byta när du vill."],
              ["Öppna ett kapitel", "Svara på övningarna. Behöver du sluta mitt i är det ingen fara – på startsidan står Fortsätt där du var."],
            ].map(([rubrik, text], i) => (
              <li key={rubrik} className="flex gap-3">
                <span className="flex-none w-6 h-6 rounded-full bg-sv-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span><strong className="text-sv-900 dark:text-gray-100">{rubrik}.</strong> {text}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section emoji="🗺️" title="De fyra världarna">
          <p>
            Världarna är <em>svårighetsnivåer</em>, inte årskurser. Många har lättast att komma igång en
            nivå under sin årskurs och går uppåt när det känns enkelt.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {STAGES.map((s) => (
              <div key={s.id} className="rounded-2xl border-2 border-sv-100 dark:border-gray-600 bg-sv-50/60 dark:bg-gray-900/50 p-3.5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xl not-italic" aria-hidden="true">{s.emoji}</span>
                  <span className="text-base font-black text-sv-800 dark:text-sv-300">{s.name}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">{s.subtitle}</p>
                <p className="text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section emoji="📚" title="Vad du kan träna på">
          <p>Varje värld har sex flikar:</p>
          <ul className="space-y-2.5">
            {AKTIVITETER.map((a) => (
              <li key={a.name} className="flex gap-3 items-start">
                <span className="flex-none w-8 h-8 rounded-xl bg-sv-50 dark:bg-gray-700 flex items-center justify-center text-base" aria-hidden="true">
                  {a.emoji}
                </span>
                <span><strong className="text-sv-900 dark:text-gray-100">{a.name}.</strong> {a.desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Sammanlagt finns omkring <strong>1 700 övningar</strong> och <strong>126 ordsöksord</strong>
            {" "}fördelade på de fyra världarna.
          </p>
        </Section>

        <Section emoji="✍️" title="Övningstyperna">
          <div className="grid gap-2 sm:grid-cols-2">
            {OVNINGSTYPER.map((t) => (
              <div key={t.name} className="rounded-2xl border-2 border-sv-100 dark:border-gray-600 bg-sv-50/60 dark:bg-gray-900/50 p-3.5">
                <p className="font-bold text-sv-900 dark:text-sv-200 mb-1">
                  <span aria-hidden="true">{t.emoji}</span> {t.name}
                </p>
                <p className="text-sm">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm">
            Svarar du fel hamnar frågan under <strong>Försök igen</strong>, så att du kan ta den en gång
            till senare.
          </p>
        </Section>

        <Section emoji="🎮" title="Spelen">
          <p>Spelen ger riktiga poäng, precis som kapitlen. De finns under fliken Spel i varje värld.</p>
          <ul className="space-y-2.5">
            {SPEL.map((g) => (
              <li key={g.name} className="flex gap-3 items-start">
                <span className="flex-none w-8 h-8 rounded-xl bg-sv-50 dark:bg-gray-700 flex items-center justify-center text-base" aria-hidden="true">
                  {g.emoji}
                </span>
                <span><strong className="text-sv-900 dark:text-gray-100">{g.name}.</strong> {g.desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Frågorna och orden hämtas ur världens egna kapitel, så de byts ut efter hand. Varje spel ger
            som mest <strong>400 poäng per dag</strong>, och varje ny omgång samma dag ger lite mindre:
            100, 80, 60, 50 och sedan 40 procent. Spelen är ett komplement till kapitlen, inte en genväg.
          </p>
        </Section>

        <Section emoji="⭐" title="Poängen">
          <ul className="space-y-1.5 list-disc pl-5 marker:text-sv-500">
            <li>Varje rätt svar ger <strong>15 poäng</strong>. Ett hittat ord i ordsökningen ger 10.</li>
            <li>Klarar du minst 60 procent av kapitlet får du dessutom en <strong>bonus</strong>.</li>
            <li>Kommer du tillbaka en ny dag väntar en <strong>daglig bonus på 50 poäng</strong>.</li>
            <li>
              Ibland slår en <strong>turbonus</strong> till och dubblar eller tredubblar poängen. Den är
              slumpad och går inte att styra.
            </li>
            <li>
              Att göra om ett kapitel ger mindre varje gång: 100, 70, 50, 30 och sedan 20 procent. Man kan
              alltså inte samla poäng på samma kapitel hur länge som helst.
            </li>
            <li>
              Att rätta ett gammalt fel under <strong>Försök igen</strong> ger 10 poäng, och mindre om
              kapitlet redan är gjort flera gånger – alltid mindre än att svara rätt direkt.
            </li>
          </ul>
          <p className="text-sm">
            Stjärnan uppe till höger visar <strong>totalt intjänade poäng</strong>. Kundvagnen visar hur
            mycket som finns kvar att handla för. Det du handlar för dras bara från kundvagnen – stjärnan
            minskar aldrig, så du tappar varken nivå, kistor eller märken av att köpa något.
          </p>
        </Section>

        <Section emoji="🏅" title="Nivåerna">
          <p>
            Dina totala poäng ger en nivå, från <strong>1 Ordnybörjare</strong> till{" "}
            <strong>{MAX_LEVEL} Svenskalegend</strong>. Nivån syns på profilen och är helt kosmetisk – den
            låser inte upp något och sjunker aldrig.
          </p>
        </Section>

        <Section emoji="🎁" title="Kistorna">
          <p>Kistor samlas under kistknappen uppe till höger. De kommer på tre sätt:</p>
          <ul className="space-y-1.5 list-disc pl-5 marker:text-amber-500">
            <li>När du passerar en <strong>poänggräns</strong> – den första vid 300 poäng.</li>
            <li>När du klarat ett visst <strong>antal kapitel</strong> – den första efter ett enda.</li>
            <li>Som ren <strong>tur</strong> efter ett avklarat kapitel.</li>
          </ul>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {KISTOR.map((c) => {
              const meta = CHEST_META[c.type];
              return (
                <div key={c.type} className="rounded-2xl border-2 border-sv-100 dark:border-gray-600 bg-sv-50/60 dark:bg-gray-900/50 p-3 text-center">
                  <img src={meta.image} alt="" className="w-10 h-10 mx-auto mb-1.5 object-contain" />
                  <p className="text-sm font-bold text-sv-900 dark:text-gray-200">{meta.label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{c.points}</p>
                </div>
              );
            })}
          </div>
          <p className="text-sm">
            En kista öppnas med ett klick. Poängen är ungefär desamma oavsett kista – det är märkena och
            chansen till en bonuskista som skiljer dem åt. Den hemliga kistan ger mest.
          </p>
        </Section>

        <Section emoji="🛒" title="Affären">
          <p>
            I affären köper du saker för dina poäng. Allt är utseende – ingenting påverkar övningarna
            eller svårighetsgraden.
          </p>
          <ul className="space-y-1.5 list-disc pl-5 marker:text-emerald-500">
            <li><strong>Figurer</strong> – din avatar. 96 stycken, 100–5 000 poäng.</li>
            <li><strong>Ramar</strong> – en ram runt figuren, 100–2 500 poäng.</li>
            <li><strong>Teman</strong> – bakgrunden i hela appen, 100–2 500 poäng.</li>
            <li><strong>Effekter</strong> – rörelse och glitter runt figuren, 100–1 000 poäng.</li>
          </ul>
          <p className="text-sm">
            Det du äger sätts på och av i affären, och du kan alltid välja <strong>Standard</strong> för
            att få tillbaka appens vanliga utseende.
          </p>
        </Section>

        <Section emoji="⚔️" title="Bossen">
          <p>
            Efter fem avklarade kapitel låses <strong>bossutmaningen</strong> upp. Den är en snabb
            frågeomgång som ger extrapoäng och märket Bossbesegrare. Första segern ger mest, den andra
            mindre, och därefter är det äran som återstår.
          </p>
        </Section>

        <Section emoji="👤" title="Profil och märken">
          <p>
            Klicka på ditt namn uppe till höger för att se din statistik: nivå, poäng per värld och
            avklarade kapitel. Där finns också <strong>märkena</strong> – för de första stegen, för
            grammatik, stavning och spel, för att vara flitig, och några som är svårare att lista ut.
          </p>
        </Section>

        <Section emoji="💡" title="Bra att veta">
          <ul className="space-y-1.5 list-disc pl-5 marker:text-gray-400">
            <li>
              <strong>Allt sparas på den enhet du använder</strong> – poäng, märken, kistor och köp.
              Ingenting ligger på en server. Byter du dator eller webbläsare börjar du om från noll, och
              rensar du webbläsarens data försvinner allt.
            </li>
            <li>
              Flera elever kan dela samma enhet. Var och en skriver sitt eget namn och har egna poäng,
              kistor och köp.
            </li>
            <li>
              <strong>Mörkt läge</strong> slås på med måne-knappen uppe till höger.
            </li>
            <li>
              Lämnar du ett kapitel mitt i kommer appen ihåg både var du var och vilka svar du hunnit ge.
            </li>
          </ul>
        </Section>

        {/* Kontaktuppgifterna står redan i den fasta listen längst ned på varje
            sida (se layout.tsx) – ingen dubblett här. */}

        <div className="pt-1 pb-16">
          <Link
            href="/"
            className="btn-primary w-full"
            style={{ background: "linear-gradient(135deg, #006AA7, #004a75)" }}
          >
            Tillbaka till appen
          </Link>
        </div>
      </main>
    </div>
  );
}
