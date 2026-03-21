import { useState, useEffect } from "react";

const STORAGE_PREFIX = "tanja-nutrition-";

const SUPPLEMENTS_DEFAULT = ["Carotin", "Ginseng", "Kollagen", "Vitamin C", "Elektrolyte", "Magnesium", "Ginkgo"];

const ALL_RECIPE_LINKS = [
  { label: "Low Carb Abendessen", emoji: "🥗", url: "https://www.chefkoch.de/rs/s0/low+carb+abendessen/Rezepte.html" },
  { label: "Zucchini Nudeln", emoji: "🍝", url: "https://www.chefkoch.de/rs/s0/zucchini+nudeln/Rezepte.html" },
  { label: "Mediterrane Salate", emoji: "🫒", url: "https://www.pinterest.de/search/pins/?q=mediterrane+salate+low+carb" },
  { label: "Protein Frühstück", emoji: "🥚", url: "https://www.chefkoch.de/rs/s0/protein+fruehstueck/Rezepte.html" },
  { label: "Leichte Suppen", emoji: "🍲", url: "https://www.chefkoch.de/rs/s0/leichte+suppen/Rezepte.html" },
  { label: "Riviera Fischgerichte", emoji: "🐟", url: "https://www.chefkoch.de/rs/s0/mediterraner+fisch/Rezepte.html" },
  { label: "Müsli mit Obst", emoji: "🥣", url: "https://www.chefkoch.de/rs/s0/muesli+obst/Rezepte.html" },
  { label: "Obstsalat Ideen", emoji: "🍓", url: "https://www.chefkoch.de/rs/s0/obstsalat/Rezepte.html" },
  { label: "Gefüllte Paprika", emoji: "🫑", url: "https://www.chefkoch.de/rs/s0/gefuellte+paprika+low+carb/Rezepte.html" },
  { label: "Griechischer Salat", emoji: "🧀", url: "https://www.chefkoch.de/rs/s0/griechischer+salat/Rezepte.html" },
  { label: "Blumenkohl Rezepte", emoji: "🥦", url: "https://www.chefkoch.de/rs/s0/blumenkohl+low+carb/Rezepte.html" },
  { label: "Proteinreiche Bowls", emoji: "🫙", url: "https://www.pinterest.de/search/pins/?q=protein+bowl+low+carb" },
];

const MOTIVATIONS = [
  "Struktur schlägt Disziplin. Immer.",
  "Du bist nicht müde — du bist dehydriert. Trink Wasser.",
  "Ab 16 Uhr: Protein gewinnt.",
  "Dein Körper arbeitet für dich, wenn du ihn lässt.",
  "Klein anfangen. Jeden Tag. Das reicht.",
  "Côte d'Azur mindset: leicht, frisch, bewusst.",
  "Ein guter Tag fängt morgens an.",
  "Routine ist Freiheit.",
  "Weniger Zucker, mehr Energie. Kein Trick.",
  "Du baust gerade etwas auf. Gib dem Zeit.",
  "Essen ist kein Feind — Chaos ist der Feind.",
  "Jeder Streak beginnt mit einem Tag.",
  "Heißhunger ist kein Versagen — es ist ein Signal.",
  "Abends leicht = morgens stark.",
  "Du machst das für dich. Nicht für andere.",
];

function getDailyRecipes() {
  const seed = parseInt(getTodayKey().replace(/-/g, ""), 10);
  const shuffled = [...ALL_RECIPE_LINKS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed + i * 17) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 4);
}

function getDailyMotivation() {
  const seed = parseInt(getTodayKey().replace(/-/g, ""), 10);
  return MOTIVATIONS[seed % MOTIVATIONS.length];
}

const MEALS = [
  { id: "morning_tea", time: "Morgen", emoji: "🍵", label: "Grüner Tee + Zitrone", note: "Wasser · kein Kaffee" },
  { id: "lunch", time: "Mittag", emoji: "🍽", label: "Hauptmahlzeit", note: "Carbs ok · Protein · Gemüse · Obst" },
  { id: "collagen_coffee", time: "Kaffee", emoji: "☕", label: "Kaffee + Kollagen", note: "Hafermilch · kein Zucker" },
  { id: "dinner", time: "Abend (No Carbs)", emoji: "🥗", label: "Leicht essen", note: "Ab 16h · Protein · Gemüse · Obst" },
];

const C = {
  bg: "#faf7f2",
  sand: "#e8dcc8",
  sandLight: "#f2ece0",
  ocean: "#3d6e8f",
  oceanDark: "#2a5070",
  oceanLight: "#a8c5d8",
  terracotta: "#c4714a",
  sage: "#6a9b7a",
  sageDark: "#4e7a5c",
  text: "#2c2416",
  textLight: "#8a7a6a",
  white: "#ffffff",
  cheat: "#e8a87c",
  cheatBg: "#fdf0e8",
};

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function formatDateLong(d = new Date()) {
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
}

const defaultDayData = () => ({ meals: {}, water: 0, tea: 0, cheatDay: false, supplements: {} });

export default function App() {
  const [tab, setTab] = useState("today");
  const [dayData, setDayData] = useState(defaultDayData());
  const [customSupplements, setCustomSupplements] = useState([]);
  const [newSupp, setNewSupp] = useState("");
  const [history, setHistory] = useState({});
  const [loaded, setLoaded] = useState(false);
  const todayKey = getTodayKey();

  // Font injection
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Load data
  useEffect(() => {
    try {
      const val = localStorage.getItem(STORAGE_PREFIX + "day-" + todayKey);
      if (val) setDayData(JSON.parse(val));
    } catch {}
    try {
      const val = localStorage.getItem(STORAGE_PREFIX + "custom-supps");
      if (val) setCustomSupplements(JSON.parse(val));
    } catch {}
    try {
      const hist = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX + "day-")) {
          try {
            const val = localStorage.getItem(key);
            if (val) hist[key.replace(STORAGE_PREFIX + "day-", "")] = JSON.parse(val);
          } catch {}
        }
      }
      setHistory(hist);
    } catch {}
    setLoaded(true);
  }, []);

  // Save today
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_PREFIX + "day-" + todayKey, JSON.stringify(dayData)); } catch {}
    setHistory(prev => ({ ...prev, [todayKey]: dayData }));
  }, [dayData, loaded]);

  const toggleMeal = (id) => setDayData(p => ({ ...p, meals: { ...p.meals, [id]: !p.meals[id] } }));
  const toggleSupplement = (name) => setDayData(p => ({ ...p, supplements: { ...p.supplements, [name]: !p.supplements[name] } }));
  const addWater = () => setDayData(p => ({ ...p, water: Math.min(p.water + 1, 12) }));
  const removeWater = () => setDayData(p => ({ ...p, water: Math.max(p.water - 1, 0) }));
  const addTea = () => setDayData(p => ({ ...p, tea: Math.min(p.tea + 1, 6) }));
  const removeTea = () => setDayData(p => ({ ...p, tea: Math.max(p.tea - 1, 0) }));
  const toggleCheatDay = () => setDayData(p => ({ ...p, cheatDay: !p.cheatDay }));

  const addCustomSupp = async () => {
    if (!newSupp.trim()) return;
    const updated = [...customSupplements, newSupp.trim()];
    setCustomSupplements(updated);
    setNewSupp("");
    try { localStorage.setItem(STORAGE_PREFIX + "custom-supps", JSON.stringify(updated)); } catch {}
  };

  const allSupplements = [...SUPPLEMENTS_DEFAULT, ...customSupplements];

  // Streak calculation
  const calcStreak = () => {
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split("T")[0];
      const data = history[key] || (key === todayKey ? dayData : null);
      if (!data) break;
      const done = MEALS.every(m => data.meals?.[m.id]) || data.cheatDay;
      if (done) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  };

  const streak = loaded ? calcStreak() : 0;
  const completedMeals = MEALS.filter(m => dayData.meals[m.id]).length;

  // History for display
  const historyEntries = Object.entries(history)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 21);

  if (!loaded) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: C.bg, fontFamily: "sans-serif", color: C.textLight }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
        <div style={{ fontSize: 14 }}>Lädt...</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 48 }}>

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(160deg, ${C.oceanDark} 0%, ${C.ocean} 60%, #5a8fa8 100%)`,
        padding: "28px 20px 22px", color: "white", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", right: 30, bottom: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", opacity: 0.65, marginBottom: 6 }}>Tanja & Oli · Côte d'Azur</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>
          {formatDateLong()}
        </div>

        {/* Daily motivation */}
        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)", borderRadius: 12, fontSize: 13, fontStyle: "italic", opacity: 0.92, lineHeight: 1.5 }}>
          "{getDailyMotivation()}"
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "7px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500 }}>
            <span>🔥</span> {streak} Tage Streak
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "7px 14px", fontSize: 13 }}>
            ✓ {completedMeals}/{MEALS.length} Mahlzeiten
          </div>
          {dayData.cheatDay && (
            <div style={{ background: C.cheat, borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600 }}>
              🎉 Cheat Day!
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: C.sand, borderBottom: `1px solid rgba(0,0,0,0.07)` }}>
        {[["today", "Heute"], ["history", "Verlauf"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "11px 0", border: "none",
            background: tab === key ? C.bg : "transparent",
            color: tab === key ? C.ocean : C.textLight,
            fontFamily: "'DM Sans', sans-serif", fontWeight: tab === key ? 600 : 400, fontSize: 13,
            cursor: "pointer", borderBottom: tab === key ? `2px solid ${C.ocean}` : "2px solid transparent",
            transition: "all 0.15s"
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === "today" && (
        <div style={{ padding: "14px 16px" }}>

          {/* Cheat Day Toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", background: dayData.cheatDay ? C.cheatBg : C.white,
            borderRadius: 16, border: `1.5px solid ${dayData.cheatDay ? C.cheat : C.sand}`,
            marginBottom: 18, transition: "all 0.2s"
          }}>
            <div>
              <div style={{ fontWeight: 500, color: C.text, fontSize: 14 }}>🎉 Cheat Day</div>
              <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>1× pro Woche · alles erlaubt</div>
            </div>
            <button onClick={toggleCheatDay} style={{
              width: 50, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
              background: dayData.cheatDay ? C.cheat : C.sand, position: "relative", transition: "background 0.2s"
            }}>
              <div style={{
                position: "absolute", top: 4, left: dayData.cheatDay ? 26 : 4,
                width: 20, height: 20, borderRadius: "50%", background: "white",
                transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)"
              }} />
            </button>
          </div>

          {/* Mahlzeiten */}
          <SectionLabel>Mahlzeiten</SectionLabel>
          {MEALS.map(meal => {
            const done = !!dayData.meals[meal.id];
            return (
              <div key={meal.id} onClick={() => toggleMeal(meal.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
                background: done ? "#eef7f1" : C.white, borderRadius: 14, marginBottom: 8,
                cursor: "pointer", border: `1.5px solid ${done ? C.sage : C.sand}`,
                transition: "all 0.15s", userSelect: "none"
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{meal.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{meal.label}</div>
                    <div style={{ fontSize: 10, color: C.textLight, background: C.sandLight, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>{meal.time}</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{meal.note}</div>
                </div>
                <CheckCircle checked={done} color={C.sage} />
              </div>
            );
          })}

          {/* Hydration */}
          <SectionLabel style={{ marginTop: 20 }}>Flüssigkeit</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <HydrationCard emoji="💧" label="Wasser (0,5L Gläser)" value={dayData.water} goal={8} onAdd={addWater} onRemove={removeWater} color={C.ocean} />
            <HydrationCard emoji="🍵" label="Grüner Tee" value={dayData.tea} goal={2} onAdd={addTea} onRemove={removeTea} color={C.sage} />
          </div>

          {/* Supplements */}
          <SectionLabel>Supplements</SectionLabel>
          <div style={{ background: C.white, borderRadius: 14, border: `1.5px solid ${C.sand}`, overflow: "hidden", marginBottom: 20 }}>
            {allSupplements.map((s, i) => {
              const done = !!dayData.supplements[s];
              return (
                <div key={s} onClick={() => toggleSupplement(s)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", cursor: "pointer",
                  borderBottom: i < allSupplements.length - 1 ? `1px solid ${C.sandLight}` : "none",
                  background: done ? "#eef7f1" : "transparent", transition: "background 0.15s"
                }}>
                  <span style={{ fontSize: 14, color: C.text, fontWeight: done ? 500 : 400 }}>{s}</span>
                  <CheckCircle checked={done} color={C.sage} size={20} />
                </div>
              );
            })}
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.sandLight}`, display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={newSupp}
                onChange={e => setNewSupp(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCustomSupp()}
                placeholder="+ Eigenes hinzufügen..."
                style={{ flex: 1, border: "none", background: "transparent", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.text, outline: "none" }}
              />
              {newSupp.trim() && (
                <button onClick={addCustomSupp} style={{ border: "none", background: C.ocean, color: "white", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Add</button>
              )}
            </div>
          </div>

          {/* Rezepte */}
          <SectionLabel>Rezept-Ideen</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {getDailyRecipes().map(r => (
              <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                background: C.white, borderRadius: 12, border: `1.5px solid ${C.sand}`,
                textDecoration: "none", color: C.text, transition: "border-color 0.15s"
              }}>
                <span style={{ fontSize: 20 }}>{r.emoji}</span>
                <span style={{ fontSize: 14 }}>{r.label}</span>
                <span style={{ marginLeft: "auto", color: C.ocean, fontSize: 18, fontWeight: 300 }}>→</span>
              </a>
            ))}
          </div>

          {/* No-Gos reminder */}
          <div style={{ background: "#fff8f5", borderRadius: 14, border: `1.5px solid #f0d4c4`, padding: "14px 16px", marginBottom: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.terracotta, marginBottom: 8, fontWeight: 600 }}>No-Gos täglich</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["❌ Zucker", "❌ Alkohol", "❌ Süßgetränke", "❌ Carbs ab 16h"].map(g => (
                <span key={g} style={{ background: "#fde8dc", color: C.terracotta, borderRadius: 20, padding: "4px 10px", fontSize: 12 }}>{g}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === "history" && (
        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <StatBox label="Streak" value={`${streak}🔥`} color={C.terracotta} />
            <StatBox label="Diese Woche" value={`${historyEntries.slice(0, 7).filter(([, d]) => MEALS.every(m => d?.meals?.[m.id]) || d?.cheatDay).length}/7`} color={C.ocean} />
            <StatBox label="Cheat Days" value={historyEntries.slice(0, 7).filter(([, d]) => d?.cheatDay).length + "x"} color={C.cheat} />
          </div>

          <SectionLabel>Verlauf</SectionLabel>
          {historyEntries.length === 0 && (
            <div style={{ textAlign: "center", color: C.textLight, padding: "40px 20px", fontSize: 14 }}>
              Noch keine Einträge.<br />Starte heute!
            </div>
          )}
          {historyEntries.map(([date, data]) => {
            const done = MEALS.every(m => data?.meals?.[m.id]);
            const cheat = data?.cheatDay;
            const count = MEALS.filter(m => data?.meals?.[m.id]).length;
            const isToday = date === todayKey;
            return (
              <div key={date} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                background: C.white, borderRadius: 12, marginBottom: 8,
                border: `1.5px solid ${done || cheat ? (cheat ? C.cheat : C.sage) : C.sand}`
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: done ? C.sage : cheat ? C.cheat : count > 0 ? C.oceanLight : C.sand,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
                }}>
                  {done ? "✓" : cheat ? "🎉" : count > 0 ? "~" : "○"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: C.text, display: "flex", gap: 6, alignItems: "center" }}>
                    {formatDateShort(date)}
                    {isToday && <span style={{ fontSize: 10, background: C.ocean, color: "white", borderRadius: 10, padding: "1px 7px" }}>Heute</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textLight, marginTop: 1 }}>
                    {done ? "Alles geschafft ✓" : cheat ? "Cheat Day" : count > 0 ? `${count}/${MEALS.length} Mahlzeiten` : "Keine Daten"}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.textLight, textAlign: "right" }}>
                  {data?.water > 0 && <div>💧 {data.water}</div>}
                  {data?.tea > 0 && <div>🍵 {data.tea}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#8a7a6a", marginBottom: 10, fontWeight: 600, ...style }}>
      {children}
    </div>
  );
}

function CheckCircle({ checked, color, size = 22 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      border: `2px solid ${checked ? color : "#e8dcc8"}`,
      background: checked ? color : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s"
    }}>
      {checked && <span style={{ color: "white", fontSize: size * 0.55, lineHeight: 1 }}>✓</span>}
    </div>
  );
}

function HydrationCard({ emoji, label, value, goal, onAdd, onRemove, color }) {
  const pct = Math.min((value / goal) * 100, 100);
  return (
    <div style={{ background: "#ffffff", borderRadius: 14, padding: 14, border: "1.5px solid #e8dcc8" }}>
      <div style={{ fontSize: 11, color: "#8a7a6a", marginBottom: 8 }}>{emoji} {label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={onRemove} style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid #e8dcc8", background: "transparent", cursor: "pointer", fontSize: 16, color: "#8a7a6a", lineHeight: 1 }}>−</button>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color, flex: 1, textAlign: "center", lineHeight: 1 }}>{value}</span>
        <button onClick={onAdd} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: color, cursor: "pointer", fontSize: 16, color: "white", lineHeight: 1 }}>+</button>
      </div>
      <div style={{ fontSize: 10, color: "#8a7a6a", textAlign: "center", marginTop: 4, marginBottom: 6 }}>Ziel: {goal}</div>
      <div style={{ height: 4, background: "#e8dcc8", borderRadius: 2 }}>
        <div style={{ height: "100%", background: color, borderRadius: 2, width: `${pct}%`, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: "#ffffff", borderRadius: 12, padding: "12px 10px", border: "1.5px solid #e8dcc8", textAlign: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#8a7a6a", marginTop: 2, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}
