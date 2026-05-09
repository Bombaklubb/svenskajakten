"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import ModuleCard from "@/components/ui/ModuleCard";
import FinalTestCard from "@/components/ui/FinalTestCard";
import { loadStudent, loadRetryQueue, removeFromRetryQueue } from "@/lib/storage";
import { getStage } from "@/lib/stages";
import { BlurFade } from "@/components/magicui/blur-fade";
import MultipleChoice from "@/components/exercises/MultipleChoice";
import FillInBlank from "@/components/exercises/FillInBlank";
import BuildSentence from "@/components/exercises/BuildSentence";
import WordClues from "@/components/exercises/WordClues";
import type { StudentData, StageContent, RetryItem } from "@/lib/types";

interface RuleItem {
  term: string;
  explanation: string;
  examples: string[];
}

interface RuleSection {
  id: string;
  title: string;
  icon: string;
  content: RuleItem[];
}

interface Props {
  params: Promise<{ stage: string }>;
}

type Tab = "grammar" | "spelling" | "wordsearch" | "regler" | "spel" | "retry";

export default function WorldPage({ params }: Props) {
  const { stage: stageId } = use(params);
  const stage = getStage(stageId);

  const [student, setStudent] = useState<StudentData | null>(null);
  const [content, setContent] = useState<StageContent | null>(null);
  const [rules, setRules] = useState<RuleSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("grammar");

  // Retry queue state
  const [retryQueue, setRetryQueue] = useState<RetryItem[]>([]);
  const [retryItem, setRetryItem] = useState<RetryItem | null>(null);
  const [retryResult, setRetryResult] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    const s = loadStudent();
    setStudent(s);
    fetch(`/content/${stageId}/content.json`)
      .then((r) => r.json())
      .then((data: StageContent) => setContent(data))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
    fetch(`/content/${stageId}/rules.json`)
      .then((r) => r.json())
      .then((data: { sections: RuleSection[] }) => setRules(data.sections))
      .catch(() => {});
    setRetryQueue(loadRetryQueue(stageId));
  }, [stageId]);

  if (!stage) return notFound();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-4xl animate-bounce-slow">{stage.emoji}</div>
      </div>
    );
  }

  const stageProgress = student?.stages[stage.id as keyof typeof student.stages];

  function getModuleProgress(kind: "grammar" | "spelling" | "wordsearch" | "stavningstest", moduleId: string) {
    if (!stageProgress) return null;
    const map =
      kind === "grammar" ? stageProgress.grammarModules
      : kind === "spelling" ? (stageProgress.spellingModules ?? {})
      : kind === "stavningstest" ? (stageProgress.stavningstestModules ?? {})
      : (stageProgress.wordsearchModules ?? {});
    return map[moduleId] ?? null;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "grammar",    label: "📝 Grammatik" },
    { id: "spelling",   label: "✏️ Stavning" },
    { id: "regler",     label: "📐 Språkregler" },
    { id: "wordsearch", label: "🔍 Ordsökning" },
    { id: "spel",       label: "🎮 Spel" },
    { id: "retry",      label: retryQueue.length > 0 ? `🔄 Försök igen (${retryQueue.length})` : "🔄 Försök igen" },
  ];

  function handleRetryAnswer(correct: boolean) {
    if (!retryItem) return;
    if (correct) {
      removeFromRetryQueue(stageId, retryItem.key);
      const updated = retryQueue.filter((q) => q.key !== retryItem.key);
      setRetryQueue(updated);
      setRetryResult("correct");
    } else {
      setRetryResult("wrong");
    }
    setTimeout(() => {
      setRetryResult(null);
      setRetryItem(null);
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900">
      <Header student={student} />

      {/* Hero */}
      <div className={`relative overflow-hidden ${stage.bgClass}`}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full transition-colors mb-4"
          >
            ← Tillbaka
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-6xl drop-shadow-lg">{stage.emoji}</span>
            <div>
              <h1 className="text-3xl font-black text-white text-shadow">{stage.name}</h1>
              <p className="text-white/70 font-semibold mt-0.5">{stage.subtitle}</p>
              <p className="text-white/60 text-sm mt-1">{stage.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {student && stageProgress && (
        <div className="bg-white dark:bg-gray-800 border-b border-sv-100 dark:border-gray-700" style={{ boxShadow: "0 2px 8px -2px rgba(249,115,22,0.06)" }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 flex-wrap">
            {[
              { label: "Grammatik", icon: "📝", count: Object.values(stageProgress.grammarModules).filter((m) => m.completed).length, total: content?.grammar.length ?? 0 },
              { label: "Stavning",  icon: "✏️", count: Object.values(stageProgress.spellingModules ?? {}).filter((m) => m.completed).length, total: content?.spelling?.length ?? 0 },
              { label: "Ordsök.",   icon: "🔍", count: Object.values(stageProgress.wordsearchModules ?? {}).filter((m) => m.completed).length, total: content?.wordsearch?.length ?? 0 },
            ].map(({ label, icon, count, total }) => {
              const done = total > 0 && count === total;
              return (
                <div
                  key={label}
                  className={`border-2 rounded-2xl px-3 py-2 text-center transition-all min-w-[60px] ${
                    done
                      ? `${stage.borderClass} bg-gradient-to-b from-white to-sv-50/30 dark:from-gray-800 dark:to-gray-700`
                      : "bg-sv-50 dark:bg-gray-700 border-sv-100 dark:border-gray-600"
                  }`}
                  style={done ? { boxShadow: "0 2px 0 0 rgba(249,115,22,0.15)" } : {}}
                >
                  <div className="text-base leading-none mb-0.5">{icon}</div>
                  <div className={`text-base font-black leading-none ${done ? stage.textClass : "text-sv-700 dark:text-gray-100"}`}>{count}/{total}</div>
                  <div className="text-xs text-sv-400 dark:text-gray-400 mt-0.5 font-medium">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <BlurFade delay={0.05} className="overflow-x-auto pb-1 mb-6">
          <div className="flex gap-1.5 bg-white dark:bg-gray-800 p-1.5 rounded-2xl w-max min-w-full border-2 border-sv-100 dark:border-gray-700" style={{ boxShadow: "0 2px 0 0 rgba(249,115,22,0.08), inset 0 1px 3px rgba(0,0,0,0.04)" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? `${stage.colorClass} text-white shadow-md scale-[1.02]`
                    : "text-sv-400 dark:text-gray-400 hover:text-sv-700 dark:hover:text-gray-200 hover:bg-sv-50 dark:hover:bg-gray-700"
                }`}
                style={activeTab === tab.id ? { boxShadow: "0 2px 0 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)" } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </BlurFade>

        {/* Spel tab */}
        {activeTab === "spel" ? (
          <div>
            <div className="mb-6 text-center">
              <div className="text-4xl mb-2">🎮</div>
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Spel</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Träna svenska och grammatik med roliga spel!</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Memory */}
              <Link href={`/world/${stageId}/spel/memory`} className="block group rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)", boxShadow: "0 4px 0 0 rgba(6,182,212,0.4)" }}>
                <div className="px-5 py-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">🃏</div>
                    <div>
                      <h3 className="font-black text-white text-lg leading-tight">Memory</h3>
                      <p className="text-white/80 text-xs">Para ihop begrepp med förklaring!</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm font-medium">Lätt (8 kort) • Medel (12 kort) • Svår (18 kort). Hitta alla par!</p>
                  <span className="inline-block mt-3 text-xs font-bold text-white/70 group-hover:text-white transition-colors">Spela nu →</span>
                </div>
              </Link>

              {/* Snögubben */}
              <Link href={`/world/${stageId}/spel/hangman`} className="block group rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", boxShadow: "0 4px 0 0 rgba(56,189,248,0.4)" }}>
                <div className="px-5 py-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">⛄</div>
                    <div>
                      <h3 className="font-black text-white text-lg leading-tight">Snögubben</h3>
                      <p className="text-white/80 text-xs">Rädda snögubben – gissa rätt!</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm font-medium">Gissa grammatikord bokstav för bokstav. Fel svar smälter snögubben!</p>
                  <span className="inline-block mt-3 text-xs font-bold text-white/70 group-hover:text-white transition-colors">Spela nu →</span>
                </div>
              </Link>

              {/* Tidsattack */}
              <Link href={`/world/${stageId}/spel/tidsattack`} className="block group rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 4px 0 0 rgba(59,130,246,0.4)" }}>
                <div className="px-5 py-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">⏱️</div>
                    <div>
                      <h3 className="font-black text-white text-lg leading-tight">Tidsattack</h3>
                      <p className="text-white/80 text-xs">60 sekunder – hur många hinner du?</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm font-medium">Grammatikfrågor i rask takt. Snabb som blixten!</p>
                  <span className="inline-block mt-3 text-xs font-bold text-white/70 group-hover:text-white transition-colors">Spela nu →</span>
                </div>
              </Link>

              {/* Samla mynt */}
              <Link href={`/world/${stageId}/spel/samla-mynt`} className="block group rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 0 0 rgba(245,158,11,0.4)" }}>
                <div className="px-5 py-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">🪙</div>
                    <div>
                      <h3 className="font-black text-white text-lg leading-tight">Samla mynt</h3>
                      <p className="text-white/80 text-xs">Rätt svar = samla, fel = hinder!</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm font-medium">Spring och samla mynt genom att svara rätt på grammatikfrågor!</p>
                  <span className="inline-block mt-3 text-xs font-bold text-white/70 group-hover:text-white transition-colors">Spela nu →</span>
                </div>
              </Link>
            </div>
          </div>

        ) : activeTab === "retry" ? (
          /* Försök igen tab */
          <div>
            {retryItem ? (
              /* Exercise view */
              <div>
                <button
                  onClick={() => { setRetryItem(null); setRetryResult(null); }}
                  className="inline-flex items-center gap-1.5 text-sv-600 dark:text-sv-400 hover:text-sv-800 dark:hover:text-sv-200 text-sm font-medium mb-4 transition-colors"
                >
                  ← Tillbaka till listan
                </button>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{retryItem.moduleIcon}</span>
                  <div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">
                      {retryItem.kind === "grammar" ? "Grammatik" : "Stavning"}
                    </div>
                    <div className="font-bold text-gray-800 dark:text-gray-100">{retryItem.moduleTitle}</div>
                  </div>
                </div>

                {retryResult ? (
                  <div className={`card text-center py-10 ${retryResult === "correct" ? "border-green-300 bg-green-50 dark:bg-green-900/20" : "border-red-300 bg-red-50 dark:bg-red-900/20"}`}>
                    <div className="text-5xl mb-3">{retryResult === "correct" ? "✅" : "❌"}</div>
                    <p className={`text-lg font-black ${retryResult === "correct" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                      {retryResult === "correct" ? "Rätt! Uppgiften är klar!" : "Fel – försök igen nästa gång!"}
                    </p>
                  </div>
                ) : (
                  <div className="card">
                    <div key={retryItem.key}>
                      {retryItem.exercise.type === "multiple-choice" && (
                        <MultipleChoice exercise={retryItem.exercise} onAnswer={handleRetryAnswer} isLast />
                      )}
                      {retryItem.exercise.type === "fill-in-blank" && (
                        <FillInBlank exercise={retryItem.exercise} onAnswer={handleRetryAnswer} isLast />
                      )}
                      {retryItem.exercise.type === "build-sentence" && (
                        <BuildSentence exercise={retryItem.exercise} onAnswer={handleRetryAnswer} isLast />
                      )}
                      {retryItem.exercise.type === "word-clues" && (
                        <WordClues exercise={retryItem.exercise} onAnswer={handleRetryAnswer} isLast />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* List view */
              <div>
                <div className="mb-6 text-center">
                  <div className="text-4xl mb-2">🔄</div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Försök igen</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Här samlas uppgifter du svarat fel på. Klara dem för att ta bort dem!
                  </p>
                </div>

                {retryQueue.length === 0 ? (
                  <div className="card text-center py-12">
                    <div className="text-5xl mb-3">🌟</div>
                    <p className="font-black text-gray-800 dark:text-gray-100 text-lg">Bra jobbat!</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Inga uppgifter att repetera just nu.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {retryQueue.map((item) => {
                      const preview =
                        item.exercise.type === "multiple-choice" ? item.exercise.question
                        : item.exercise.type === "fill-in-blank" ? item.exercise.question
                        : item.exercise.type === "word-clues" ? item.exercise.clues[0]
                        : item.exercise.instruction;
                      return (
                        <button
                          key={item.key}
                          onClick={() => { setRetryItem(item); setRetryResult(null); }}
                          className="w-full text-left card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-xl flex-shrink-0">
                              {item.moduleIcon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">
                                  {item.kind === "grammar" ? "Grammatik" : "Stavning"}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{item.moduleTitle}</span>
                              </div>
                              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                                {preview}
                              </p>
                            </div>
                            <span className="text-sv-400 group-hover:text-sv-600 transition-colors flex-shrink-0">→</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        ) : /* Language rules tab */
        activeTab === "regler" ? (
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="card text-center py-8 text-gray-400">Laddar regler...</div>
            ) : (
              rules.map((section) => (
                <details key={section.id} className="card group" open>
                  <summary className="flex items-center gap-3 cursor-pointer list-none select-none">
                    <span className="text-2xl">{section.icon}</span>
                    <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base flex-1">{section.title}</h2>
                    <span className="text-gray-400 text-sm group-open:rotate-180 transition-transform duration-200">▼</span>
                  </summary>
                  <div className="mt-4 space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {section.content.map((item, i) => (
                      <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">{item.term}</div>
                        {item.explanation && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{item.explanation}</div>
                        )}
                        {item.examples.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.examples.map((ex, j) => (
                              <span key={j} className="bg-sv-50 dark:bg-sv-900/30 border border-sv-200 dark:border-sv-700 rounded-lg px-2.5 py-1 text-xs text-sv-800 dark:text-sv-200 font-mono">
                                {ex}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))
            )}
          </div>

        ) : !content ? (
          <div className="card text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>Kunde inte ladda innehåll.</p>
          </div>

        ) : activeTab === "spelling" ? (
          <div className="space-y-6">
            {/* Regular spelling modules */}
            {(content.spelling ?? []).length > 0 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(content.spelling ?? []).map((mod, idx, arr) => (
                    <ModuleCard
                      key={mod.id}
                      id={mod.id}
                      title={mod.title}
                      description={mod.description}
                      icon={mod.icon}
                      kind="spelling"
                      stage={stage}
                      progress={getModuleProgress("spelling", mod.id)}
                      locked={false}
                      prevModuleTitle={idx > 0 ? arr[idx - 1].title : null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stavningstest på tid */}
            {(content.stavningstest ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <span className="text-xl">⏱️</span>
                  <h3 className="font-black text-gray-800 dark:text-gray-100 text-base">Stavningstest på tid</h3>
                  <span className="badge bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 text-xs">60 sek · Alla rätt krävs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(content.stavningstest ?? []).map((mod, idx, arr) => (
                    <ModuleCard
                      key={mod.id}
                      id={mod.id}
                      title={mod.title}
                      description={mod.description}
                      icon={mod.icon}
                      kind="stavningstest"
                      stage={stage}
                      progress={getModuleProgress("stavningstest", mod.id)}
                      locked={false}
                      prevModuleTitle={idx > 0 ? arr[idx - 1].title : null}
                    />
                  ))}
                </div>
              </div>
            )}

            {(content.spelling ?? []).length === 0 && (content.stavningstest ?? []).length === 0 && (
              <div className="card text-center py-10 text-gray-400">
                <div className="text-3xl mb-2">✏️</div>
                <p>Inga stavningsövningar tillgängliga ännu.</p>
              </div>
            )}
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(
              activeTab === "grammar"
                ? [...content.grammar].sort((a, b) => {
                    const aFinal = a.id === "sluttest" || a.id === "sluttest-2";
                    const bFinal = b.id === "sluttest" || b.id === "sluttest-2";
                    if (aFinal && bFinal) return a.id === "sluttest" ? -1 : 1;
                    return aFinal ? 1 : bFinal ? -1 : 0;
                  })
              : (content.wordsearch ?? [])
            ).map((mod, idx, arr) => {
              if (activeTab === "grammar" && (mod.id === "sluttest" || mod.id === "sluttest-2")) {
                const num = mod.id === "sluttest" ? 1 : 2;
                return (
                  <div key={mod.id} className="col-span-1 sm:col-span-2">
                    <FinalTestCard
                      stage={stage}
                      progress={getModuleProgress("grammar", mod.id)}
                      moduleId={mod.id}
                      number={num}
                    />
                  </div>
                );
              }
              return (
                <ModuleCard
                  key={mod.id}
                  id={mod.id}
                  title={mod.title}
                  description={mod.description}
                  icon={mod.icon}
                  kind={activeTab as "grammar" | "wordsearch"}
                  stage={stage}
                  progress={getModuleProgress(activeTab as "grammar" | "wordsearch", mod.id)}
                  locked={false}
                  prevModuleTitle={idx > 0 ? arr[idx - 1].title : null}
                />
              );
            })}
            {activeTab === "wordsearch" && (content.wordsearch ?? []).length === 0 && (
              <div className="card text-center py-10 text-gray-400 col-span-1 sm:col-span-2">
                <div className="text-3xl mb-2">🔍</div>
                <p>Inga moduler tillgängliga ännu.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
