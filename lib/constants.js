// ─── COLORS ──────────────────────────────────────────────────────────────────
export const P = {
  bg:'#080F1E', card:'#1A2744', raised:'#243361',
  gold:'#C9A84C', goldDim:'#7A5F2A', goldFg:'#F0D88A',
  blue:'#4A90D9', white:'#F0F4FF', muted:'#7A8BA8',
  green:'#48BB78', red:'#FC8181', orange:'#F6AD55',
  tanja:'#C9A84C', oli:'#4A90D9', border:'#1E3055',
};

// ─── CYCLE ───────────────────────────────────────────────────────────────────
const CYCLE_START = new Date('2026-04-28T00:00:00');
export const PHASES = [
  { days:[1,2,3,4,5], emoji:'🩸', name:'MENSTRUATION', color:'#8B1A3A', noAlc:true, mag:2,
    food:'Warm + aufbauend · Protein + Eisen · Kürbiskerne · Ingwertee',
    tip:'Heute sanft sein. Wärme, Ruhe, Eisen tanken.' },
  { days:[6,7,8,9,10,11,12,13], emoji:'✨', name:'FOLLIKELPHASE', color:'#1A5A3A', noAlc:false, mag:1,
    food:'BESTE ABNEHMPHASE! No-Carb ab 16h · Protein max · Omega-3 · Beeren',
    tip:'Energie steigt! Jetzt neue Projekte starten.' },
  { days:[14], emoji:'⚡', name:'EISPRUNG', color:'#7A5A00', noAlc:true, mag:1,
    food:'TOP TAG! OPC doppelt · Antioxidantien · Beeren · Brokkoli · Protein hoch',
    tip:'Peak-Energie! OPC Traubenkernextrakt doppelt nehmen.' },
  { days:[15,16,17,18,19,20,21,22,23,24,25,26,27,28], emoji:'🌿', name:'LUTEALPHASE', color:'#1A3A2A', noAlc:false, mag:2,
    food:'Komplex-Carbs gegen Heißhunger · Süßkartoffel · Hafer · Magnesium 2x',
    tip:'Heißhunger kommt? Dunkle Schoki >70% ist erlaubt!' },
];

export function getCycle(date) {
  const day = ((Math.floor((date - CYCLE_START) / 86400000) % 28) + 28) % 28 + 1;
  return { day, ...PHASES.find(p => p.days.includes(day)) };
}

export function getMoon(date) {
  const phase = (((date - new Date('2026-05-15')) / 86400000 % 29.53) + 29.53) % 29.53;
  return ['🌑','🌒','🌒','🌓','🌔','🌔','🌕','🌖','🌖','🌗','🌘','🌘'][Math.floor(phase / 2.46)];
}

// ─── SUPPLEMENTS & MEDS ──────────────────────────────────────────────────────
export const SUPP_T = [
  { id:'d3', l:'D3 + K2 + MCT', w:'morgens', lab:'🔴 VD: 40.7 nmol/L — kritisch!' },
  { id:'carotin', l:'Carotin / Astaxanthin', w:'morgens' },
  { id:'ginkgo', l:'Ginkgo', w:'morgens' },
  { id:'ginseng', l:'Ginseng / Frauenfeuer', w:'morgens' },
  { id:'kollagen', l:'Kollagen 10-15g', w:'mit Kaffee' },
  { id:'opc', l:'OPC Traubenkernextrakt', w:'tagsüber' },
  { id:'mag', l:'Magnesium', w:'abends', lab:'⚠️ Calcium 2.17 — Mg hilft' },
  { id:'b12', l:'B12', w:'abends', lab:'⚠️ B12: 289 pmol/L — knapp unter optimal' },
];

export const MEDS_O = [
  { id:'bupro', l:'Bupropion 150mg', w:'morgens bis 11:00 Uhr', emoji:'💊', dead:11 },
  { id:'tafil_m', l:'Tafil 0,5mg', w:'morgens bis 11:00 Uhr', emoji:'💊', dead:11 },
  { id:'amit', l:'Amitriptylin 25mg', w:'abends 18:00–20:00 Uhr', emoji:'🌙', dead:null },
];

// ─── DRINKS ──────────────────────────────────────────────────────────────────
export const DRINKS_DEF = [
  { k:'wasser', e:'💧', l:'Wasser (0,5L)', xp:1, hydro:500, cat:'gut' },
  { k:'gruentee', e:'🍵', l:'Grüntee + Zitrone + Ingwer', xp:1.5, hydro:250, cat:'gut', note:'Morgen-Ritual ✓ · Vit C für Eisen' },
  { k:'kraeutert', e:'🌿', l:'Kräutertee / Ingwertee', xp:0.5, hydro:250, cat:'gut' },
  { k:'oj', e:'🍊', l:'OJ / Zitronenwasser frisch', xp:1, hydro:150, cat:'gut', note:'Vit C steigert Eisenaufnahme ✓' },
  { k:'hafermilch', e:'🥛', l:'Hafermilch', xp:0.5, hydro:150, cat:'gut' },
  { k:'kokoswas', e:'🥥', l:'Kokoswasser', xp:0.5, hydro:300, cat:'gut', note:'Elektrolyte ✓' },
  { k:'esp_kol', e:'☕', l:'Espresso + Kollagen (vor 14h)', xp:1, hydro:-80, cat:'ok', note:'Kollagen-Bonus ✓' },
  { k:'esp_ok', e:'☕', l:'Espresso (vor 14h)', xp:0.5, hydro:-100, cat:'ok', note:'30 Min Abstand zur Mahlzeit — Eisenaufnahme!' },
  { k:'esp_sp', e:'☕', l:'Espresso (nach 14h)', xp:-1, hydro:-150, cat:'schlecht', note:'Schlaf ↓ · Kortisol ↑' },
  { k:'esp_3', e:'☕', l:'Espresso (3. oder mehr)', xp:-0.5, hydro:-150, cat:'schlecht', note:'Entwässerung + Nervosität' },
  { k:'softdrink', e:'🥤', l:'Softdrink / Cola', xp:-1, hydro:80, cat:'schlecht', note:'Zucker! Glucose 108 ⚠️' },
  { k:'energy', e:'⚡', l:'Energy Drink', xp:-3, hydro:0, cat:'schlecht', note:'Stressreaktion ↑↑' },
  { k:'rotwein1', e:'🍷', l:'Rotwein (1 Glas)', xp:-0.5, hydro:-200, cat:'alkohol', note:'Resveratrol ↑ · trotzdem Leber + Schlaf ↓' },
  { k:'rotwein2', e:'🍷', l:'Rotwein (2+ Gläser)', xp:-1.5, hydro:-400, cat:'alkohol' },
  { k:'weisswein', e:'🥂', l:'Weißwein / Prosecco', xp:-1, hydro:-200, cat:'alkohol' },
  { k:'bier', e:'🍺', l:'Bier (0,5L)', xp:-2, hydro:-300, cat:'alkohol' },
  { k:'shot', e:'🥃', l:'Shot / Spirituosen', xp:-2.5, hydro:-100, cat:'alkohol' },
];

export const isAlc = k => ['rotwein1','rotwein2','weisswein','bier','shot'].includes(k);

// ─── MEAL SLOTS ──────────────────────────────────────────────────────────────
export const MEAL_SLOTS = [
  { id:'morgen', label:'Morgen', emoji:'🍵', sublabel:'Grüntee · kein Kaffee · nüchtern', time:'Morgen' },
  { id:'mittag', label:'Hauptmahlzeit', emoji:'🍽️', sublabel:'Carbs ok · Protein · Gemüse · Obst', time:'Mittag' },
  { id:'kaffee', label:'Kaffee + Kollagen', emoji:'☕', sublabel:'Hafermilch · kein Zucker', time:'Kaffee' },
  { id:'abend', label:'Leicht essen', emoji:'🥗', sublabel:'Ab 16h · Protein · Gemüse · kein Carbs', time:'Abend (No Carbs)' },
];

export const NO_GOS = ['Zucker', 'Alkohol', 'Süßgetränke', 'Carbs ab 16h'];

export const REZEPT_IDEEN = [
  { emoji:'🥚', name:'Protein Frühstück', desc:'Rührei + Tomaten + Gurke + Kräuter' },
  { emoji:'🥗', name:'Low Carb Abendessen', desc:'Lachs + großer Salat + Zitronendressing' },
  { emoji:'🐟', name:'Riviera Fischgerichte', desc:'Lachs · Thunfisch · Dorade mit Kräutern' },
  { emoji:'🫒', name:'Mediterrane Salate', desc:'Falafel-Bowl · Quinoa · Tahini · Zitrone' },
  { emoji:'🍗', name:'Hähnchen Variations', desc:'Mit Brokkoli · Knoblauch · Süßkartoffel' },
  { emoji:'🥑', name:'Avocado Bowls', desc:'Avocado + Ei + Gurke + Kräuter' },
];

// ─── ANTI-INFLAMMATION ────────────────────────────────────────────────────────
export const ANTI_INF = [
  { k:'ingwer', l:'Ingwer', e:'🫚', xp:0.5 },
  { k:'kurkuma', l:'Kurkuma', e:'🟡', xp:0.5 },
  { k:'omega3', l:'Omega-3 (Lachs/Walnuss)', e:'🐟', xp:0.5 },
  { k:'beeren', l:'Beeren (frisch/TK)', e:'🫐', xp:0.5 },
  { k:'knoblauch', l:'Knoblauch', e:'🧄', xp:0.5 },
  { k:'brokkoli', l:'Brokkoli', e:'🥦', xp:0.5 },
  { k:'opc_food', l:'OPC Traubenkernextrakt', e:'🍇', xp:1 },
];

// ─── GAMIFICATION ─────────────────────────────────────────────────────────────
export const LEVELS = ['Starter','Explorer','Creator','Architect','Champion','Legend'];
export const getLvl = xp => Math.min(Math.floor(xp / 40), LEVELS.length - 1);
export const SKILLS = [
  { k:'business', l:'Business', e:'💼' }, { k:'vitality', l:'Vitality', e:'💪' },
  { k:'bond', l:'Bond', e:'💑' }, { k:'glow', l:'Glow', e:'✨' },
  { k:'base', l:'Base Camp', e:'🏠' }, { k:'content', l:'Content', e:'📱' },
];
export const INIT_T = { business:3, vitality:2, bond:3, glow:2, base:3, content:3 };
export const INIT_O = { business:3, vitality:2, bond:3, glow:1, base:2, content:2 };

// ─── MIND ────────────────────────────────────────────────────────────────────
export const MIND_CATS = [
  { k:'energie', l:'Energie', e:'⚡' }, { k:'stimmung', l:'Stimmung', e:'😊' },
  { k:'fokus', l:'Fokus', e:'🎯' }, { k:'stress', l:'Stress', e:'🌪️' },
  { k:'koerper', l:'Körper', e:'💪' }, { k:'kreativ', l:'Kreativität', e:'🎨' },
];
export const M0 = () => Object.fromEntries(MIND_CATS.map(c => [c.k, 5]));

// ─── WATER GOALS ──────────────────────────────────────────────────────────────
export const WATER_T = 2500; // ml Tanja
export const WATER_O = 3000; // ml Oli
export const WATER_GLASS = 250; // ml per glass

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
export const DAYS_ORDER = ['SO','MO','DI','MI','DO','FR','SA'];

export const SCHED = {
  MO:[
    {id:'mo01',time:'07:00',text:'Aufstehen · Grüntee + Zitrone + Ingwer (nüchtern) · 0,5L Wasser sofort',p:'T',cat:'MORNING',xp:1},
    {id:'mo02',time:'07:30',text:'Journaling / Meditation (5-10 Min) · Morgensonne 🌞',p:'T',cat:'MORNING',xp:1},
    {id:'mo03',time:'08:00',text:'Aufstehen · Morning Routine · Medikamente (bis 11h!) 💊',p:'O',cat:'MORNING',xp:1},
    {id:'mo04',time:'08:08',text:'ARBEITSBLOCK I · easyCare',p:'T',cat:'ARBEIT',xp:2},
    {id:'mo05',time:'08:45',text:'📞 Team Call easyCare (wöchentlich)',p:'T',cat:'ARBEIT',xp:1,hi:true},
    {id:'mo06',time:'10:00',text:'🍺 IRISH PUB: Monday Quiz — Content posten!',p:'T',cat:'CONTENT',xp:2,hi:true},
    {id:'mo07',time:'12:12',text:'MITTAGSPAUSE 🎉',p:'BOTH',cat:'PAUSE',xp:0},
    {id:'mo08',time:'12:15',text:'🐾 Gassi ZUSAMMEN — Chico & Sunny',p:'BOTH',cat:'GASSI',xp:1},
    {id:'mo09',time:'13:00',text:'Mittagessen gemeinsam',p:'BOTH',cat:'ESSEN',xp:1},
    {id:'mo10',time:'13:30',text:'✂️ Content Edit I (30 Min)',p:'T',cat:'CONTENT',xp:2},
    {id:'mo11',time:'13:30',text:'Tamosique Tasks / Strategie',p:'O',cat:'PLAN',xp:1},
    {id:'mo12',time:'14:14',text:'ARBEITSBLOCK II',p:'T',cat:'ARBEIT',xp:2},
    {id:'mo13',time:'14:14',text:'Eigenes Business',p:'O',cat:'ARBEIT',xp:2},
    {id:'mo14',time:'18:30',text:'🐾 Gassi allein Oli — Chico & Sunny',p:'O',cat:'GASSI',xp:1},
    {id:'mo15',time:'18:30',text:'💊 Amitriptylin 25mg (18-20h)',p:'O',cat:'MORNING',xp:0},
    {id:'mo16',time:'19:00',text:'Kochen (Tanja) — leicht · keine KH ab 16h',p:'T',cat:'ESSEN',xp:1},
    {id:'mo17',time:'19:30',text:'✂️ Content Edit II + Posting (45 Min)',p:'T',cat:'CONTENT',xp:2},
    {id:'mo18',time:'20:30',text:'💑 QUALITY TIME · Screen-free 📵',p:'BOTH',cat:'QUALITY',xp:2},
  ],
  DI:[
    {id:'di01',time:'07:00',text:'Aufstehen · Grüntee nüchtern · Supplements · Journaling',p:'T',cat:'MORNING',xp:1},
    {id:'di02',time:'08:08',text:'ARBEITSBLOCK I',p:'T',cat:'ARBEIT',xp:2},
    {id:'di03',time:'09:00',text:'Aufstehen · Medikamente (bis 11h!) 💊',p:'O',cat:'MORNING',xp:1},
    {id:'di04',time:'10:00',text:'🍺 IRISH PUB WOCHE B: Heute posten!',p:'T',cat:'CONTENT',xp:2,hi:true},
    {id:'di05',time:'12:15',text:'🐾 Gassi allein Tanja',p:'T',cat:'GASSI',xp:1},
    {id:'di06',time:'12:45',text:'💆 Beauty: Dusche + Haare + Eincremen + Gerät',p:'T',cat:'BEAUTY',xp:1},
    {id:'di07',time:'13:30',text:'Mittagessen · Kochen (Oli)',p:'BOTH',cat:'ESSEN',xp:1},
    {id:'di08',time:'14:14',text:'ARBEITSBLOCK II',p:'T',cat:'ARBEIT',xp:2},
    {id:'di09',time:'14:14',text:'Tamosique Strategie',p:'O',cat:'PLAN',xp:2},
    {id:'di10',time:'18:30',text:'🐾 Gassi ZUSAMMEN',p:'BOTH',cat:'GASSI',xp:1},
    {id:'di11',time:'18:30',text:'💊 Amitriptylin 25mg (18-20h)',p:'O',cat:'MORNING',xp:0},
    {id:'di12',time:'19:00',text:'Kochen (Oli)',p:'O',cat:'ESSEN',xp:1},
    {id:'di13',time:'19:30',text:'✂️ Content Edit II (45 Min)',p:'T',cat:'CONTENT',xp:2},
    {id:'di14',time:'20:30',text:'💑 QUALITY TIME · Screen-free 📵',p:'BOTH',cat:'QUALITY',xp:2},
  ],
  MI:[
    {id:'mi01',time:'07:00',text:'Aufstehen · Grüntee nüchtern · Supplements · Journaling',p:'T',cat:'MORNING',xp:1},
    {id:'mi02',time:'08:08',text:'ARBEITSBLOCK I',p:'T',cat:'ARBEIT',xp:2},
    {id:'mi03',time:'09:00',text:'Aufstehen · Medikamente (bis 11h!) 💊',p:'O',cat:'MORNING',xp:1},
    {id:'mi04',time:'10:00',text:'📧 EASYCARE: Goodbye & Willkommen Mail erstellen',p:'T',cat:'CONTENT',xp:2,hi:true},
    {id:'mi05',time:'12:15',text:'🐾 Gassi allein Oli',p:'O',cat:'GASSI',xp:1},
    {id:'mi06',time:'13:00',text:'Kochen (Tanja) · Mittagessen gemeinsam',p:'BOTH',cat:'ESSEN',xp:1},
    {id:'mi07',time:'13:45',text:'🧹 Haushalt ZUSAMMEN (30-45 Min)',p:'BOTH',cat:'HAUSHALT',xp:1},
    {id:'mi08',time:'14:14',text:'ARBEITSBLOCK II',p:'T',cat:'ARBEIT',xp:2},
    {id:'mi09',time:'14:14',text:'Admin: Versicherungen · Behörden · Bänderriss-Doku',p:'O',cat:'PLAN',xp:1},
    {id:'mi10',time:'18:30',text:'🐾 Gassi ZUSAMMEN',p:'BOTH',cat:'GASSI',xp:1},
    {id:'mi11',time:'18:30',text:'💊 Amitriptylin 25mg (18-20h)',p:'O',cat:'MORNING',xp:0},
    {id:'mi12',time:'19:00',text:'Kochen (Oli)',p:'O',cat:'ESSEN',xp:1},
    {id:'mi13',time:'19:30',text:'✂️ Content Edit + Captions (1h)',p:'T',cat:'CONTENT',xp:2},
    {id:'mi14',time:'20:30',text:'💑 QUALITY TIME · Screen-free 📵',p:'BOTH',cat:'QUALITY',xp:2},
  ],
  DO:[
    {id:'do01',time:'07:00',text:'Aufstehen · Grüntee nüchtern · Supplements · Journaling',p:'T',cat:'MORNING',xp:1},
    {id:'do02',time:'08:08',text:'ARBEITSBLOCK I',p:'T',cat:'ARBEIT',xp:2},
    {id:'do03',time:'09:00',text:'Aufstehen · Medikamente (bis 11h!) 💊',p:'O',cat:'MORNING',xp:1},
    {id:'do04',time:'10:00',text:'🍔 IRISH PUB: Burger Day — Content posten!',p:'T',cat:'CONTENT',xp:2,hi:true},
    {id:'do05',time:'10:00',text:'📝 EASYCARE: Blog vorbereiten',p:'T',cat:'CONTENT',xp:2,hi:true},
    {id:'do06',time:'12:15',text:'🐾 Gassi ZUSAMMEN',p:'BOTH',cat:'GASSI',xp:1},
    {id:'do07',time:'13:00',text:'Kochen (Tanja) · Mittagessen',p:'BOTH',cat:'ESSEN',xp:1},
    {id:'do08',time:'13:30',text:'💆 Skincare + Gerät Tanja (~30 Min)',p:'T',cat:'BEAUTY',xp:1},
    {id:'do09',time:'14:00',text:'🎯 Tamosique Wochenplanung ZUSAMMEN (30 Min)',p:'BOTH',cat:'PLAN',xp:2},
    {id:'do10',time:'14:14',text:'ARBEITSBLOCK II',p:'T',cat:'ARBEIT',xp:2},
    {id:'do11',time:'16:30',text:'🧹 Haushalt (45 Min)',p:'O',cat:'HAUSHALT',xp:1},
    {id:'do12',time:'18:30',text:'🐾 Gassi allein Tanja',p:'T',cat:'GASSI',xp:1},
    {id:'do13',time:'18:30',text:'💊 Amitriptylin 25mg (18-20h)',p:'O',cat:'MORNING',xp:0},
    {id:'do14',time:'19:30',text:'✂️ Content Posting + WE-Planung',p:'T',cat:'CONTENT',xp:2},
    {id:'do15',time:'20:30',text:'💑 QUALITY TIME · Screen-free 📵',p:'BOTH',cat:'QUALITY',xp:2},
  ],
  FR:[
    {id:'fr01',time:'08:30',text:'Lockerer Morgen · Gemeinsames Frühstück · Supplements',p:'BOTH',cat:'MORNING',xp:1},
    {id:'fr02',time:'09:00',text:'Medikamente Oli (bis 11h!) · Journaling Tanja',p:'O',cat:'MORNING',xp:1},
    {id:'fr03',time:'10:00',text:'🐾 Gassi allein Oli — ausgiebige Runde',p:'O',cat:'GASSI',xp:1},
    {id:'fr04',time:'12:00',text:'🎯 Tamosique Strategie-Block ZUSAMMEN (1-2h)',p:'BOTH',cat:'PLAN',xp:3},
    {id:'fr05',time:'14:00',text:'Kochen (Tanja) · Mittagessen gemeinsam',p:'BOTH',cat:'ESSEN',xp:1},
    {id:'fr06',time:'15:00',text:'🎥 Ausflug + Filming ZUSAMMEN — Riviera Lifestyle',p:'BOTH',cat:'CONTENT',xp:3},
    {id:'fr07',time:'18:30',text:'🐾 Gassi ZUSAMMEN',p:'BOTH',cat:'GASSI',xp:1},
    {id:'fr08',time:'18:30',text:'💊 Amitriptylin 25mg (18-20h)',p:'O',cat:'MORNING',xp:0},
    {id:'fr09',time:'19:30',text:'Kochen (Oli) — etwas Besonderes 🍽️',p:'O',cat:'ESSEN',xp:1},
    {id:'fr10',time:'20:30',text:'💑 QUALITY TIME',p:'BOTH',cat:'QUALITY',xp:2},
  ],
  SA:[
    {id:'sa01',time:'09:00',text:'Lockerer Morgen · Frühstück · Supplements',p:'BOTH',cat:'MORNING',xp:1},
    {id:'sa02',time:'09:30',text:'Medikamente Oli (bis 11h!) · Journaling Tanja',p:'O',cat:'MORNING',xp:1},
    {id:'sa03',time:'10:30',text:'🐾 Gassi ZUSAMMEN — lange Runde mit Chico & Sunny',p:'BOTH',cat:'GASSI',xp:2},
    {id:'sa04',time:'12:00',text:'🎥 HAUPT-DREHTAG ZUSAMMEN: Ausflug · Riviera · Lifestyle',p:'BOTH',cat:'CONTENT',xp:3},
    {id:'sa05',time:'14:00',text:'Essen unterwegs / Picknick',p:'BOTH',cat:'ESSEN',xp:1},
    {id:'sa06',time:'16:00',text:'Freizeit: Strand · Terrasse · Entspannen',p:'BOTH',cat:'PAUSE',xp:0},
    {id:'sa07',time:'17:00',text:'💆 Beauty & Selfcare Tanja (2. Wochenend-Session)',p:'T',cat:'BEAUTY',xp:1},
    {id:'sa08',time:'17:00',text:'Selfcare Oli (separat)',p:'O',cat:'BEAUTY',xp:1},
    {id:'sa09',time:'18:30',text:'🐾 Gassi allein Oli',p:'O',cat:'GASSI',xp:1},
    {id:'sa10',time:'18:30',text:'💊 Amitriptylin 25mg (18-20h)',p:'O',cat:'MORNING',xp:0},
    {id:'sa11',time:'19:30',text:'Kochen (Tanja) — schönes Abendessen',p:'T',cat:'ESSEN',xp:1},
    {id:'sa12',time:'20:30',text:'💑 QUALITY TIME',p:'BOTH',cat:'QUALITY',xp:2},
  ],
  SO:[
    {id:'so01',time:'09:00',text:'Ruhiger Morgen · Grüntee · Supplements',p:'BOTH',cat:'MORNING',xp:1},
    {id:'so02',time:'09:30',text:'Medikamente Oli (bis 11h!) · Journaling Tanja',p:'O',cat:'MORNING',xp:1},
    {id:'so03',time:'10:30',text:'🐾 Gassi allein Tanja — längste Runde der Woche',p:'T',cat:'GASSI',xp:2},
    {id:'so04',time:'12:00',text:'🛒 Großeinkauf (alle 2W: Nizza oder Italien, 3-4h)',p:'T',cat:'EINKAUF',xp:2},
    {id:'so05',time:'13:30',text:'Mittagessen · Kochen (Oli) — Sonntagsessen',p:'BOTH',cat:'ESSEN',xp:1},
    {id:'so06',time:'15:00',text:'🧹 Haushalt + Wochenvorbereitung ZUSAMMEN',p:'BOTH',cat:'HAUSHALT',xp:1},
    {id:'so07',time:'16:30',text:'✂️ Content: Captions + Posting-Plan ZUSAMMEN',p:'BOTH',cat:'CONTENT',xp:2},
    {id:'so08',time:'18:00',text:'💆 Beauty & Selfcare Tanja (2. Selfcare der Woche)',p:'T',cat:'BEAUTY',xp:1},
    {id:'so09',time:'18:30',text:'🐾 Gassi ZUSAMMEN — Wochenabschluss',p:'BOTH',cat:'GASSI',xp:1},
    {id:'so10',time:'18:30',text:'💊 Amitriptylin 25mg (18-20h)',p:'O',cat:'MORNING',xp:0},
    {id:'so11',time:'19:30',text:'Kochen (Oli) — leichtes Abendessen',p:'O',cat:'ESSEN',xp:1},
    {id:'so12',time:'20:30',text:'💑 Ruhiger Abend · QUALITY TIME',p:'BOTH',cat:'QUALITY',xp:2},
  ],
};

// ─── MONACO EVENTS 2026 ───────────────────────────────────────────────────────
export const MONACO_EVENTS = [
  { date:'2026-05-21', end:'2026-05-24', name:'Monaco Grand Prix', emoji:'🏎️', cat:'F1', important:true },
  { date:'2026-07-12', end:'2026-07-19', name:'Monte-Carlo Masters (Tennis)', emoji:'🎾', cat:'Tennis', important:true },
  { date:'2026-06-05', end:'2026-06-07', name:'Monaco ePrix', emoji:'⚡', cat:'Formula E' },
  { date:'2026-07-04', end:'2026-07-04', name:'Fête Nationale de Monaco', emoji:'🇲🇨', cat:'Event', important:true },
  { date:'2026-08-01', end:'2026-08-10', name:'Monaco Yacht Show Vorsaison', emoji:'⛵', cat:'Event' },
  { date:'2026-09-23', end:'2026-09-27', name:'Monaco Yacht Show', emoji:'🛥️', cat:'Event', important:true },
  { date:'2026-11-18', end:'2026-11-18', name:'Fête du Prince', emoji:'👑', cat:'Event' },
];

// ─── CONTENT PIPELINE STATUS ──────────────────────────────────────────────────
export const PIPELINE_STAGES = [
  { id:'idee', label:'Idee', emoji:'💡', color:'#7A8BA8' },
  { id:'geplant', label:'Geplant', emoji:'📋', color:'#4A90D9' },
  { id:'gedreht', label:'Gedreht', emoji:'🎬', color:'#C9A84C' },
  { id:'schnitt', label:'Im Schnitt', emoji:'✂️', color:'#F6AD55' },
  { id:'live', label:'Live 🎉', emoji:'🚀', color:'#48BB78' },
];

export const CHANNELS = [
  { id:'tamosique', label:'@tamosique', emoji:'💼', color:'#C9A84C', lang:'de/en' },
  { id:'oli_personal', label:'@markolivertüttelmann', emoji:'🎯', color:'#4A90D9', lang:'de' },
];
