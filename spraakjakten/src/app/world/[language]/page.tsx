"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import { loadStudent } from "@/lib/storage";
import { getLanguage } from "@/lib/languages";
import { BlurFade } from "@/components/magicui/blur-fade";
import type { StudentData, LanguageContent, VocabularyModule, GrammarModule } from "@/lib/types";

interface Props {
  params: Promise<{ language: string }>;
}

type Tab = "vocabulary" | "grammar" | "spel" | "ordlista";

export default function WorldPage({ params }: Props) {
  const { language: langId } = use(params);
  const lang = getLanguage(langId);

  const [student, setStudent] = useState<StudentData | null>(null);
  const [content, setContent] = useState<LanguageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("vocabulary");

  useEffect(() => {
    const s = loadStudent();
    setStudent(s);
    fetch(`/content/${langId}/content.json`)
      .then((r) => r.json())
      .then((data: LanguageContent) => setContent(data))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [langId]);

  if (!lang) return notFound();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <div className="text-4xl animate-bounce-slow">{lang.flag}</div>
      </div>
    );
  }

  const langProgress = student?.languages[lang.id];

  function getModuleProgress(kind: "vocabulary" | "grammar", moduleId: string) {
    if (!langProgress) return null;
    const map = kind === "vocabulary" ? langProgress.vocabularyModules : langProgress.grammarModules;
    return map[moduleId] ?? null;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "vocabulary", label: "📚 Ordförråd" },
    { id: "grammar",    label: "📝 Grammatik" },
    { id: "spel",       label: "🎮 Spel" },
    { id: "ordlista",   label: "🔤 Ordlista" },
  ];

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-gray-900">
      <Header student={student} />

      {/* Hero banner */}
      <div className={`relative overflow-hidden ${lang.bgClass}`}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full transition-colors mb-4"
          >
            ← Tillbaka
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-6xl drop-shadow-lg">{lang.flag}</span>
            <div>
              <div className="text-sm font-bold text-white/70 mb-1">{lang.nativeName}</div>
              <h1
                className="text-3xl sm:text-4xl font-black text-white"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
              >
                {lang.name}
              </h1>
              <p className="text-white/80 text-sm mt-1 max-w-md">{lang.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-sj-500 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Vocabulary Tab */}
        {activeTab === "vocabulary" && (
          <div>
            <BlurFade delay={0} className="mb-4">
              <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">Ordförråd</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Lär dig nya ord och fraser</p>
            </BlurFade>

            {!content?.vocabulary?.length ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-500">Inga ordförrådsmoduler ännu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.vocabulary.map((mod: VocabularyModule, i: number) => {
                  const progress = getModuleProgress("vocabulary", mod.id);
                  return (
                    <BlurFade key={mod.id} delay={0.04 + i * 0.04}>
                      <ModuleCard
                        href={`/world/${langId}/vocabulary/${mod.id}`}
                        icon={mod.icon}
                        title={mod.title}
                        description={mod.description}
                        bonusPoints={mod.bonusPoints}
                        completed={progress?.completed ?? false}
                        points={progress?.points ?? 0}
                        langBorderClass={lang.borderClass}
                        langBgClass={lang.bgClass}
                      />
                    </BlurFade>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Grammar Tab */}
        {activeTab === "grammar" && (
          <div>
            <BlurFade delay={0} className="mb-4">
              <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">Grammatik</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Lär dig grammatikens regler</p>
            </BlurFade>

            {!content?.grammar?.length ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-500">Inga grammatikmoduler ännu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.grammar.map((mod: GrammarModule, i: number) => {
                  const progress = getModuleProgress("grammar", mod.id);
                  return (
                    <BlurFade key={mod.id} delay={0.04 + i * 0.04}>
                      <ModuleCard
                        href={`/world/${langId}/grammar/${mod.id}`}
                        icon={mod.icon}
                        title={mod.title}
                        description={mod.description}
                        bonusPoints={mod.bonusPoints}
                        completed={progress?.completed ?? false}
                        points={progress?.points ?? 0}
                        langBorderClass={lang.borderClass}
                        langBgClass={lang.bgClass}
                      />
                    </BlurFade>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Games Tab */}
        {activeTab === "spel" && (
          <div>
            <BlurFade delay={0} className="mb-4">
              <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">Spel</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Träna på ett roligt sätt</p>
            </BlurFade>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { href: `/world/${langId}/spel/memory`, icon: "🃏", title: "Memory", desc: "Matcha ord med deras betydelse", color: "bg-gradient-to-br from-purple-700 to-purple-500" },
                { href: `/world/${langId}/spel/hangman`, icon: "🎯", title: "Hänga gubbe", desc: "Gissa ordet bokstav för bokstav", color: "bg-gradient-to-br from-rose-700 to-rose-500" },
              ].map((game, i) => (
                <BlurFade key={game.href} delay={0.04 + i * 0.04}>
                  <Link href={game.href}>
                    <div className="rounded-2xl overflow-hidden border-3 border-gray-200 hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                         style={{ boxShadow: "0 4px 0 0 rgba(0,0,0,0.1)" }}>
                      <div className={`${game.color} px-5 py-6 flex items-center gap-4`}>
                        <span className="text-5xl">{game.icon}</span>
                        <div>
                          <h3 className="text-xl font-black text-white">{game.title}</h3>
                          <p className="text-white/80 text-sm">{game.desc}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 px-5 py-3 flex justify-end">
                        <span className="text-sm font-black text-sj-600 group-hover:text-sj-700">Spela →</span>
                      </div>
                    </div>
                  </Link>
                </BlurFade>
              ))}
            </div>
          </div>
        )}

        {/* Word list Tab */}
        {activeTab === "ordlista" && (
          <div>
            <BlurFade delay={0} className="mb-4">
              <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">Ordlista</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nyckelord och fraser för {lang.name.toLowerCase()}</p>
            </BlurFade>
            <WordList languageId={langId} />
          </div>
        )}
      </main>
    </div>
  );
}

// ─── ModuleCard component ─────────────────────────────────────────────────────

interface ModuleCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  bonusPoints: number;
  completed: boolean;
  points: number;
  langBorderClass: string;
  langBgClass: string;
}

function ModuleCard({ href, icon, title, description, bonusPoints, completed, points, langBorderClass, langBgClass }: ModuleCardProps) {
  return (
    <Link href={href} className="block group">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl border-3 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg overflow-hidden ${
          completed ? "border-emerald-300" : langBorderClass
        }`}
        style={{ boxShadow: "0 3px 0 0 rgba(0,0,0,0.08)" }}
      >
        <div className="px-4 py-4 flex items-start gap-3">
          <span className="text-3xl flex-shrink-0 mt-0.5">{icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm leading-tight">{title}</h3>
              {completed ? (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">✓ Klar</span>
              ) : (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">+{bonusPoints}p</span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
            {points > 0 && (
              <p className="text-xs text-amber-600 font-bold mt-1">⭐ {points} poäng</p>
            )}
          </div>
        </div>
        <div className="px-4 pb-3 flex justify-end">
          <span className="text-xs font-black text-sj-600 group-hover:text-sj-700">Öva →</span>
        </div>
      </div>
    </Link>
  );
}

// ─── WordList component ───────────────────────────────────────────────────────

const WORD_LISTS: Record<string, Array<{ word: string; translation: string; example?: string }>> = {
  franska: [
    { word: "bonjour", translation: "hej / god dag", example: "Bonjour, comment ça va?" },
    { word: "merci", translation: "tack", example: "Merci beaucoup!" },
    { word: "s'il vous plaît", translation: "snälla / var god", example: "Un café, s'il vous plaît." },
    { word: "au revoir", translation: "hej då", example: "Au revoir, à bientôt!" },
    { word: "oui / non", translation: "ja / nej", example: "Oui, je comprends." },
    { word: "la maison", translation: "huset", example: "C'est ma maison." },
    { word: "le chat", translation: "katten", example: "Le chat est noir." },
    { word: "le chien", translation: "hunden", example: "Mon chien s'appelle Rex." },
    { word: "l'école", translation: "skolan", example: "Je vais à l'école." },
    { word: "le livre", translation: "boken", example: "J'aime lire des livres." },
    { word: "je m'appelle", translation: "jag heter", example: "Je m'appelle Marie." },
    { word: "j'ai ___ ans", translation: "jag är ___ år", example: "J'ai douze ans." },
  ],
  spanska: [
    { word: "hola", translation: "hej", example: "¡Hola, cómo estás?" },
    { word: "gracias", translation: "tack", example: "Muchas gracias!" },
    { word: "por favor", translation: "snälla / var god", example: "Un agua, por favor." },
    { word: "adiós", translation: "hej då", example: "¡Adiós, hasta luego!" },
    { word: "sí / no", translation: "ja / nej", example: "Sí, entiendo." },
    { word: "la casa", translation: "huset", example: "Esta es mi casa." },
    { word: "el gato", translation: "katten", example: "El gato es negro." },
    { word: "el perro", translation: "hunden", example: "Mi perro se llama Rex." },
    { word: "la escuela", translation: "skolan", example: "Voy a la escuela." },
    { word: "el libro", translation: "boken", example: "Me gusta leer libros." },
    { word: "me llamo", translation: "jag heter", example: "Me llamo Carlos." },
    { word: "tengo ___ años", translation: "jag är ___ år", example: "Tengo doce años." },
  ],
  tyska: [
    { word: "hallo", translation: "hej", example: "Hallo, wie geht es dir?" },
    { word: "danke", translation: "tack", example: "Danke schön!" },
    { word: "bitte", translation: "snälla / var god / tack", example: "Ein Wasser, bitte." },
    { word: "auf Wiedersehen", translation: "hej då", example: "Auf Wiedersehen, bis bald!" },
    { word: "ja / nein", translation: "ja / nej", example: "Ja, ich verstehe." },
    { word: "das Haus", translation: "huset", example: "Das ist mein Haus." },
    { word: "die Katze", translation: "katten", example: "Die Katze ist schwarz." },
    { word: "der Hund", translation: "hunden", example: "Mein Hund heißt Rex." },
    { word: "die Schule", translation: "skolan", example: "Ich gehe zur Schule." },
    { word: "das Buch", translation: "boken", example: "Ich lese gerne Bücher." },
    { word: "ich heiße", translation: "jag heter", example: "Ich heiße Anna." },
    { word: "ich bin ___ Jahre alt", translation: "jag är ___ år", example: "Ich bin zwölf Jahre alt." },
  ],
};

function WordList({ languageId }: { languageId: string }) {
  const words = WORD_LISTS[languageId] ?? [];
  if (!words.length) return (
    <div className="card text-center py-12">
      <div className="text-4xl mb-3">📖</div>
      <p className="text-gray-500">Ingen ordlista tillgänglig</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {words.map((item, i) => (
        <BlurFade key={i} delay={0.02 + i * 0.02}>
          <div className="card !p-4 flex items-start gap-4">
            <div className="bg-sj-50 rounded-xl px-3 py-2 min-w-[120px] text-center">
              <span className="font-black text-sj-700 text-sm">{item.word}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{item.translation}</p>
              {item.example && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{item.example}</p>
              )}
            </div>
          </div>
        </BlurFade>
      ))}
    </div>
  );
}
