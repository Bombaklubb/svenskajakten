"use client";

import { useState, useRef } from "react";

type Category = "äventyr" | "fantasi" | "sci-fi" | "mysterium" | "vardag";
type SlotKey = "huvudroll" | "medhjalpare" | "bov" | "problem" | "miljo";

const CATEGORIES: { id: Category; label: string; emoji: string; color: string; shadow: string }[] = [
  { id: "äventyr",   label: "Äventyr",   emoji: "⚔️",  color: "#d97706", shadow: "rgba(217,119,6,0.4)" },
  { id: "fantasi",   label: "Fantasi",   emoji: "🧙",  color: "#7c3aed", shadow: "rgba(124,58,237,0.4)" },
  { id: "sci-fi",    label: "Sci-Fi",    emoji: "🚀",  color: "#0891b2", shadow: "rgba(8,145,178,0.4)" },
  { id: "mysterium", label: "Mysterium", emoji: "🔍",  color: "#475569", shadow: "rgba(71,85,105,0.4)" },
  { id: "vardag",    label: "Vardag",    emoji: "🏠",  color: "#16a34a", shadow: "rgba(22,163,74,0.4)" },
];

const SLOTS: { id: SlotKey; label: string; emoji: string }[] = [
  { id: "huvudroll",   label: "Huvudroll",   emoji: "🦸" },
  { id: "miljo",       label: "Miljö",       emoji: "🌍" },
  { id: "problem",     label: "Problem",     emoji: "⚠️" },
  { id: "bov",         label: "Bov",         emoji: "😈" },
  { id: "medhjalpare", label: "Medhjälpare", emoji: "🤝" },
];

type Pool = Record<SlotKey, string[]>;
const DATA: Record<Category, Pool> = {
  "äventyr": {
    huvudroll: [
      "En modig ung riddare", "En nyfiken skattletare", "En djärv piratkapten",
      "En envis klättrare", "En slug detektiv", "En snabb budbärare",
      "En ung arkeolog", "En erfaren jägare", "En modig soldat",
      "En ung expeditionsdeltagare", "En driftig uppfinnare", "En listig smugglare",
    ],
    medhjalpare: [
      "En lojal hund", "En vis gammal magiker", "En pratglad papegoja",
      "En stark häst", "En liten robot", "En flygande katt",
      "En skicklig bonde", "En hemlig agent", "En klok bibliotekarie",
      "En snabb spejare", "En tyst snickare", "En hemlig dubbelagent",
    ],
    bov: [
      "En girig skattjägare", "En elak pirat", "En mörk riddare",
      "En slem brottsling", "En korrupt general", "En mystisk bedragare",
      "En hänsynslös bandit", "En hemlig spion", "En grym ledare",
      "En enväldig kung", "En svekfull handlare", "En iskall lönnmördare",
    ],
    problem: [
      "Kartan var stulen", "Porten var låst med ett olösligt lås",
      "Broen hade rasat", "En storm närmade sig",
      "Skatten hade försvunnit", "En mystisk förbannelse föll över byn",
      "Den hemliga koden var felaktig", "Fienden var nära",
      "Kompassnålen pekade fel", "En lavin blockerade vägen",
      "Förrådet av mat tog slut", "Skeppet läckte",
    ],
    miljo: [
      "I en tät djungel", "På ett stormigt hav",
      "I en underjordisk grotta", "På en öde öken",
      "I ett gammalt slott", "På en snötäckt bergstopp",
      "I en djup skog", "På en mystisk ö",
      "I en forntida ruin", "Under havsytan",
      "I ett brinnande torn", "På en smal bergsklyfta",
    ],
  },
  "fantasi": {
    huvudroll: [
      "En ung trollkarl", "En modig alv", "Den siste draken",
      "En förtrollad prins", "En fe med brutna vingar", "En dvärgsmed",
      "En talande bok", "En halvtroll", "En stjärnguide",
      "En magisk vandrare", "En ung siare", "En bortglömd gudinna",
    ],
    medhjalpare: [
      "En liten drake", "En vis trollpacka", "En glittrande elf",
      "En pratande spegel", "En gammal ekorntroll", "En magisk fågel",
      "En ande i en lampa", "En enhörning", "En försvunnen dryad",
      "En hemlig häxare", "En flygande sköldpadda", "En pratande svärd",
    ],
    bov: [
      "Den mörke kejsaren", "En illvillig häxmästare", "En förtrollad stentroll",
      "En girig drakvakt", "En förtrollad drottning", "En korrumperad magiker",
      "En förbannad riddare", "En skuggkung", "En mystisk bedragare",
      "En elak demonlord", "En isvarg med mörk magi", "En sömnig men farlig gigant",
    ],
    problem: [
      "Magins källa hade sinat", "En gammal förbannelse vaknade",
      "Den magiska kristallen krossades", "Alla elverna glömde sin magi",
      "Stjärnstaven hade försvunnit", "Drömmarnas värld höll på att försvinna",
      "Den eviga elden slocknade", "En portal öppnades till fel rike",
      "Tidens hjul stannade", "Världsträdet skakade",
      "Månen föll mot marken", "Alla djur hade förvandlats till sten",
    ],
    miljo: [
      "I sagoskogens hjärta", "På en magi-akademi högt i molnen",
      "I underjordskungen's rike", "I den förtrollade skogen",
      "I trollkarlarnas hemliga torn", "På ön bortom oceanen",
      "I ett ispalats längst i norr", "I den flygande borgen",
      "I djupet av en magisk grotta", "I månens reflektion",
      "På regnbågens ände", "I det sjunkande ökenkungariket",
    ],
  },
  "sci-fi": {
    huvudroll: [
      "En ung rymdforskarstudent", "En AI-robot med egna tankar", "En ensam rymdkapten",
      "En genmodifierad människa", "En tidspilot", "En skicklig hackare",
      "En xenobiolog", "En intergalaktisk diplomat", "En kolonist på en ny planet",
      "En rymduppfinnare", "En telepatisk mutant", "En cyborgsoldat med samvete",
    ],
    medhjalpare: [
      "En liten rymdrobot", "En AI-dator med personlighet", "En vänlig utomjording",
      "En nano-drönare", "En mänsklig klon", "En kvantdator",
      "En rymdbioingenjör", "En telepatisk alien", "En halvmänsklig android",
      "En gammal rymdveteran", "En molekylär nanobot", "En holografisk assistent",
    ],
    bov: [
      "En skurkig megakorporation", "En upprorisk AI", "En invasionsflotta",
      "En galaktisk diktator", "En korrumperad vetenskapsman", "En virusspridare",
      "En rymdpirat", "En xenofob militärchef", "En mörk energivarelse",
      "En korrumperad tidsvakt", "En parasitisk rymdsvamp", "En okänd intelligens",
    ],
    problem: [
      "Syret på rymdstationen sinade", "Rymdskeppet förlorade navigationen",
      "En okänd sjukdom spred sig ombord", "En tidslinga uppstod",
      "Portalens koordinater var fel", "En artificiell intelligens gick amok",
      "Planeten höll på att implodera", "Kommunikationerna stördes av brus",
      "Gravitationen upphörde plötsligt", "En okänd civilisation sände ett mystiskt meddelande",
      "Kraftkällan var på väg att explodera", "Alla minnen raderades utan förvarning",
    ],
    miljo: [
      "Ombord på ett rymdskepp i hyperrymden", "På en koloni på Mars",
      "Utanför galaxens kant", "På en rymdstation i omloppsbana",
      "I djupet av ett svart hål", "På en planet med dubbla solar",
      "I en tidskorridor", "På en okänd exoplanet",
      "I ett underjordiskt laboratorium", "I en virtuell verklighet",
      "I en koloni under ett fruset hav", "I ett förstört rymdtorn",
    ],
  },
  "mysterium": {
    huvudroll: [
      "En nyfiken privatdetektiv", "En journalist med känsla", "En ung och nervös utredare",
      "En pensionerad polis", "En framstående professor", "En hemlig informatör",
      "Ett modigt vittne", "En kriminalpsykolog", "En förmögen arvtagare",
      "En envist förhörare", "En amatördetektiv med tur", "En kryptolog",
    ],
    medhjalpare: [
      "En skarpsinnig assistent", "En teknisk analytiker", "En hemlig informatör",
      "En gammal arkivarie", "En smart dataspecialist", "En trofast vän",
      "En medicinsk expert", "En skicklig låsöppnare", "En intuitiv medium",
      "En hemlig insider", "En listig journalist", "En rättsmedicinsk specialist",
    ],
    bov: [
      "En mystisk utpressare", "En korrupt företagsledare", "En skum politiker",
      "En hemlig kriminalorganisation", "En svartsjuk arvtagare", "En skicklig bedragare",
      "En hämndlysten rival", "En hemlig kultsekt", "En okänd identitet",
      "En manipulativ person med agenda", "En fejkad hjälte", "En välkänd men kall person",
    ],
    problem: [
      "Det viktigaste beviset försvann", "Vittnet vägrade prata",
      "Spåren pekade mot fel person", "Alibit stämde inte alls",
      "En hemlig kod dolde sanningen", "Spåren ledde ingenstans",
      "Tidtabellen stämde inte", "Det viktiga dokumentet försvann",
      "Alla misstänkta hade alibi", "Beviskedjan var trasig",
      "Nyckelpersonen hade dubbla identiteter", "Säkerhetsfilmen var raderad",
    ],
    miljo: [
      "I ett gammalt gods på landet", "I en modern storstad",
      "På ett litet fiskeläge", "I ett stängt museum",
      "På ett låst tåg", "I en igenbommad fabrik",
      "I en akademisk institution", "På ett övergivet hotell",
      "I en diplomatisk ambassad", "I en labyrintisk gammal stad",
      "På ett isigt forskningsskepp", "I en tunnelbana klockan tre på natten",
    ],
  },
  "vardag": {
    huvudroll: [
      "En vanlig tonåring", "En ny elev i klassen", "En nervös sportstjärna",
      "En ung uppfinnare", "En ambitiös klassordförande", "En musikalisk talang",
      "En envis hacker-student", "En entusiastisk volontär", "En skolkamrat med en hemlighet",
      "En försiktig men modig elev", "En drömmare med en plan", "En ung journalist på skoltidningen",
    ],
    medhjalpare: [
      "En bästa vän", "En rolig lärare", "En äldre syskon",
      "En ny granne", "Klassens outsider", "En hund som förstår allt",
      "En oväntad allierad", "En digital kompis online", "En förälder med rätt råd",
      "En klok mentor", "En slumpmässig förbipasserande", "En äldre elev som minns allt",
    ],
    bov: [
      "Den populäraste i klassen", "En mobbande grupp", "En orättvis lärare",
      "En rivaliserande skola", "Den egna rädslan", "En missuppfattning som spridit sig",
      "En svår konkurrent", "En gammal fiende", "En lögn som spridit sig",
      "Grupptrycket", "En avundsjuk klasskamrat", "Sociala medier",
    ],
    problem: [
      "Hemligheten hade läckt", "Vänskapet var på väg att bryta",
      "Tidsfristen var imorgon", "Ingenting gick som planerat",
      "Alla hade missförstått situationen", "Den viktiga tävlingen närmade sig",
      "Pengarna räckte inte", "Det viktigaste hade glömts bort",
      "Kommunikationen havererade", "Den enda chansen höll på att försvinna",
      "Mobilen dog i precis fel ögonblick", "Brevet skickades till fel person",
    ],
    miljo: [
      "I skolans korridorer", "På sommarlägret",
      "I byn under sommaren", "På sportplanen",
      "I klassrummet", "På en familjeresa",
      "I biblioteket sent på kvällen", "På fritidsgården",
      "I ett familjemöte som gick fel", "I stadsparken",
      "På skolbussen tidigt en måndag", "I omklädningsrummet innan matchen",
    ],
  },
};

function buildIntro(v: Record<SlotKey, string>, cat: Category): string {
  const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  const { huvudroll: hr, medhjalpare: med, bov, problem: prob, miljo } = v;
  switch (cat) {
    case "äventyr":
      return `${miljo} väntade en fara som inte fick underskattas. ${hr} visste vad som stod på spel — ${lc(prob)}. Det var ${lc(bov)} som låg bakom alltihop. Nu gällde det att hålla huvudet kallt och lita på ${lc(med)}.`;
    case "fantasi":
      return `${miljo} dolde sig magi och urgamla hemligheter. ${hr} hade sökt detta ställe länge, men nu var det inte tid att tveka — ${lc(prob)}. Det var ${lc(bov)} som hade satt igång det hela. Tur att ${lc(med)} var redo att ge stöd.`;
    case "sci-fi":
      return `Larm och varningssignaler ekade ${lc(miljo)}. ${hr} analyserade situationen blixtsnabbt: ${lc(prob)}. Bakom det hela stod ${lc(bov)}, och de visste precis vad de höll på med. Den enda chansen var ${lc(med)}.`;
    case "mysterium":
      return `${miljo} doldes en hemlighet som inte fick komma fram. ${hr} hade börjat dra i trådarna — och det de hittade var oroande: ${lc(prob)}. ${bov} stod troligtvis bakom alltihop. Men med hjälp av ${lc(med)} kanske sanningen äntligen kunde avslöjas.`;
    case "vardag":
      return `Dagen hade börjat precis som vanligt ${lc(miljo)}. Men ${lc(hr)} märkte snart att något var fel — ${lc(prob)}. Det var ${lc(bov)} som hade ställt till det. Lyckligtvis dök ${lc(med)} upp precis i rätt tid.`;
  }
}

const EMPTY: Record<SlotKey, string> = {
  huvudroll: "", medhjalpare: "", bov: "", problem: "", miljo: "",
};
const ALL_SPINNING: Record<SlotKey, boolean> = {
  huvudroll: false, medhjalpare: false, bov: false, problem: false, miljo: false,
};

export default function SkrivgeneratorTab() {
  const [category, setCategory] = useState<Category>("äventyr");
  const [values, setValues] = useState<Record<SlotKey, string>>(EMPTY);
  const [spinning, setSpinning] = useState<Record<SlotKey, boolean>>(ALL_SPINNING);
  const [hasSpun, setHasSpun] = useState(false);
  const intervalsRef = useRef<Record<SlotKey, ReturnType<typeof setInterval> | null>>({
    huvudroll: null, medhjalpare: null, bov: null, problem: null, miljo: null,
  });

  function pickRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function spinSlots(slots: SlotKey[]) {
    const anyAlreadySpinning = Object.values(spinning).some(Boolean);
    if (anyAlreadySpinning) return;

    setSpinning((prev) => {
      const next = { ...prev };
      for (const s of slots) next[s] = true;
      return next;
    });

    for (const slot of slots) {
      let count = 0;
      const pool = DATA[category][slot];
      if (intervalsRef.current[slot]) clearInterval(intervalsRef.current[slot]!);

      const id = setInterval(() => {
        count++;
        setValues((prev) => ({ ...prev, [slot]: pickRandom(pool) }));
        if (count >= 12) {
          clearInterval(id);
          intervalsRef.current[slot] = null;
          setSpinning((prev) => ({ ...prev, [slot]: false }));
        }
      }, 70);

      intervalsRef.current[slot] = id;
    }

    setHasSpun(true);
  }

  const isAnySpinning = Object.values(spinning).some(Boolean);

  function handleCategoryChange(cat: Category) {
    if (isAnySpinning) return;
    setCategory(cat);
    setValues(EMPTY);
    setHasSpun(false);
  }

  const catInfo = CATEGORIES.find((c) => c.id === category)!;

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="text-4xl mb-2">✍️</div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Skrivgenerator</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Välj ett tema och snurra fram din berättelsestart!
        </p>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              disabled={isAnySpinning}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                active
                  ? "text-white border-transparent shadow-lg scale-105"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
              style={active ? { background: cat.color, boxShadow: `0 4px 0 0 ${cat.shadow}` } : {}}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* SNURRA ALLT button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => spinSlots(["huvudroll", "medhjalpare", "bov", "problem", "miljo"])}
          disabled={isAnySpinning}
          className="group relative transition-all duration-150 active:scale-95 disabled:cursor-not-allowed"
        >
          <div
            className="px-10 py-4 rounded-2xl text-white font-black text-xl tracking-wide transition-all"
            style={{
              background: isAnySpinning
                ? "#6b7280"
                : `linear-gradient(135deg, ${catInfo.color}ee, ${catInfo.color})`,
              boxShadow: isAnySpinning
                ? "0 3px 0 0 #4b5563"
                : `0 5px 0 0 ${catInfo.shadow}, 0 8px 20px ${catInfo.shadow}`,
              transform: isAnySpinning ? "translateY(2px)" : undefined,
            }}
          >
            <span className="flex items-center gap-3">
              <span className={`text-2xl ${isAnySpinning ? "animate-spin" : "group-hover:rotate-[360deg] transition-transform duration-500"}`}>
                🎰
              </span>
              {isAnySpinning ? "Snurrar…" : "SNURRA ALLT!"}
            </span>
          </div>
        </button>
      </div>

      {/* Slots */}
      {!hasSpun ? (
        <div className="card text-center py-14 mb-6 border-dashed">
          <div className="text-6xl mb-4">{catInfo.emoji}</div>
          <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">
            Tryck på <span className="font-black text-gray-900 dark:text-white">SNURRA ALLT!</span>
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Tema valt: <strong className="text-gray-600 dark:text-gray-300">{catInfo.label}</strong>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {SLOTS.map((slot) => {
            const isSpinning = spinning[slot.id];
            return (
              <div
                key={slot.id}
                className={`rounded-2xl border-2 p-4 transition-all duration-200 ${
                  isSpinning
                    ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40 scale-[0.98]"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-base leading-none">{slot.emoji}</span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {slot.label}
                    </span>
                  </div>
                  <button
                    onClick={() => spinSlots([slot.id])}
                    disabled={isAnySpinning}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Snurra om denna del"
                  >
                    <span className={isSpinning ? "animate-spin inline-block" : ""}>🔄</span>
                  </button>
                </div>
                <p
                  className={`font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug min-h-[2.5rem] transition-opacity duration-75 ${
                    isSpinning ? "opacity-30" : "opacity-100"
                  }`}
                >
                  {values[slot.id] || "…"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Story summary */}
      {hasSpun && !isAnySpinning && (
        <div
          className="rounded-2xl border-2 p-5"
          style={{
            background: `linear-gradient(135deg, ${catInfo.color}10, ${catInfo.color}05)`,
            borderColor: `${catInfo.color}40`,
          }}
        >
          <p className="font-black text-gray-800 dark:text-gray-100 text-sm mb-2">
            📖 Din berättelsestart:
          </p>
          <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed italic">
            {buildIntro(values, category)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Snurra om enskilda delar med 🔄 eller tryck på <strong>SNURRA ALLT!</strong> för en ny start.
          </p>
        </div>
      )}
    </div>
  );
}
