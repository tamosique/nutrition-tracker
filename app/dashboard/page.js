'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { saveData, loadAllData, subscribeToChanges } from '@/lib/supabase';
import Avatar, { AvatarCustomizer } from '@/components/Avatar';
import {
  P, getCycle, getMoon, SUPP_T, MEDS_O, DRINKS_DEF, ANTI_INF,
  MEAL_SLOTS, NO_GOS, REZEPT_IDEEN, LEVELS, getLvl, SKILLS,
  INIT_T, INIT_O, WATER_T, WATER_O, WATER_GLASS, SCHED,
  DAYS_ORDER, MIND_CATS, M0, isAlc, MONACO_EVENTS,
} from '@/lib/constants';
import { getCurrentWeek, getUpcomingDays, formatDayLabel } from '@/lib/calendar-utils';
import { registerSW, requestNotificationPermission, scheduleDailyReminders, showNotification } from '@/lib/notifications';
import { analyzeFoodText, analyzeFoodPhoto, getLifestyleScore, planCalendar, askAI, getCycleInsight, getWeeklyReview } from '@/lib/ai-client';

// ─── CATEGORY STYLES ─────────────────────────────────────────────────────────
const CAT = {
  ARBEIT:{bg:'#12243F',a:'#2A5A9F',l:'ARBEIT'}, GASSI:{bg:'#0F2A18',a:'#2A6A3A',l:'GASSI'},
  ESSEN:{bg:'#0F2530',a:'#1A6A7A',l:'ESSEN'}, CONTENT:{bg:'#1A0F35',a:'#4A2A9F',l:'CONTENT'},
  QUALITY:{bg:'#2A0F1A',a:'#9F2A5A',l:'QUALITY'}, HAUSHALT:{bg:'#201510',a:'#6A4A1A',l:'HAUSHALT'},
  BEAUTY:{bg:'#200F2A',a:'#6A2A9F',l:'BEAUTY'}, MORNING:{bg:'#201A08',a:'#6A5A18',l:'MORGEN'},
  PLAN:{bg:'#0F182A',a:'#2A4A9F',l:'PLANUNG'}, PAUSE:{bg:'#141414',a:'#3A3A3A',l:'PAUSE'},
  EINKAUF:{bg:'#0F1F2A',a:'#1A5A7A',l:'EINKAUF'},
};

const inp = { background:P.raised, border:`1px solid ${P.border}`, borderRadius:8, padding:'9px 12px', color:P.white, fontSize:12, outline:'none', width:'100%' };
const bsm = { padding:'4px 8px', borderRadius:6, border:`1px solid ${P.border}`, background:P.raised, color:P.muted, fontSize:11, cursor:'pointer' };

// AI helpers now use central /api/ai route (see lib/ai-client.js)

// ─── TASK LIST ────────────────────────────────────────────────────────────────
function TaskList({ tasks, done, onToggle, readonly = false }) {
  if (!tasks.length) return <div style={{ background:P.card, borderRadius:10, padding:24, textAlign:'center', color:P.muted, border:`1px solid ${P.border}` }}>Keine Tasks</div>;
  return (
    <div style={{ background:P.card, borderRadius:10, overflow:'hidden', border:`1px solid ${P.border}` }}>
      {tasks.map((t, i) => {
        const isDone = !!done[t.id], cc = CAT[t.cat] || CAT.PAUSE;
        const pc = t.p === 'BOTH' ? P.green : t.p === 'T' ? P.tanja : P.oli;
        return (
          <div key={t.id} onClick={() => !readonly && onToggle(t)}
            style={{ display:'flex', alignItems:'flex-start', padding:'10px 12px', borderBottom:i<tasks.length-1?'1px solid #0F1829':'none', cursor:readonly?'default':'pointer', background:isDone?'#0A1A0A22':t.hi?P.gold+'0D':'transparent', opacity:isDone?0.6:1, transition:'background 0.15s' }}>
            {!readonly && (
              <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, marginRight:10, marginTop:2, border:`1.5px solid ${isDone?P.green:'#2A3A5A'}`, background:isDone?P.green+'22':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {isDone && <span style={{ color:P.green, fontSize:12, lineHeight:1 }}>✓</span>}
              </div>
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginBottom:3 }}>
                <span style={{ fontSize:8, color:P.muted }}>{t.time}</span>
                <span style={{ fontSize:7.5, padding:'1px 5px', borderRadius:4, background:cc.bg, border:`1px solid ${cc.a}44`, color:P.muted }}>{cc.l}</span>
                <span style={{ fontSize:7.5, padding:'1px 5px', borderRadius:4, color:pc, fontWeight:700, background:pc+'1A', border:`1px solid ${pc}44` }}>{t.p==='BOTH'?'BEIDE':t.p==='T'?'TANJA':'OLI'}</span>
              </div>
              <div style={{ fontSize:12, color:isDone?P.muted:P.white, textDecoration:isDone?'line-through':'none', lineHeight:1.4 }}>{t.text}</div>
            </div>
            {t.xp > 0 && <span style={{ fontSize:9, color:P.gold, fontWeight:700, flexShrink:0, marginLeft:6 }}>+{t.xp}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const now = new Date();
  const dk = DAYS_ORDER[now.getDay()];
  const dkey = now.toISOString().split('T')[0];
  const hr = now.getHours(), min = now.getMinutes();
  const cycle = getCycle(now), moon = getMoon(now);
  const dateStr = now.toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status]);

  const who = session?.who || 'T';

  // ─── STATE ─────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('heute');
  const [selDay, setSelDay] = useState(dk);
  const [done, setDone] = useState({});
  const [custom, setCustom] = useState([]);
  const [taskIn, setTaskIn] = useState('');
  const [xpT, setXpT] = useState(0);
  const [xpO, setXpO] = useState(0);
  const [streak, setStreak] = useState(0);
  const [route, setRoute] = useState(null);
  const [flash, setFlash] = useState(null);
  const [ready, setReady] = useState(false);
  // Supplements & Meds
  const [suppT, setSuppT] = useState({});
  const [medO, setMedO] = useState({});
  const [tafilPrn, setTafilPrn] = useState(0);
  const [suppOExtra, setSuppOExtra] = useState([]);
  const [newMedTxt, setNewMedTxt] = useState('');
  const [newMedW, setNewMedW] = useState('morgens');
  const [addingMed, setAddingMed] = useState(false);
  // Mind
  const [mindT, setMindT] = useState(M0());
  const [mindO, setMindO] = useState(M0());
  const [mindTab, setMindTab] = useState(who);
  // Sleep
  const [slp, setSlp] = useState({ T:{bed:'',wake:'',q:0,notes:''}, O:{bed:'',wake:'',q:0,notes:''} });
  // Drinks
  const [drinks, setDrinks] = useState([]);
  const [drinkForm, setDrinkForm] = useState({ p:who, k:'wasser' });
  // Meals
  const [meals, setMeals] = useState({ morgen:false, mittag:false, kaffee:false, abend:false });
  const [cheatDay, setCheatDay] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState({ T:0, O:0 });
  // Cannabis
  const [cannabis, setCannabis] = useState([]);
  const [cf, setCf] = useState({ p:who, time:'', sorte:'', typ:'Indica', menge:'', form:'Vaporizer', feeling:5 });
  // Food KI
  const [food, setFood] = useState([]);
  const [foodIn, setFoodIn] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [foodView, setFoodView] = useState('heute'); // 'heute' or 'verlauf'
  const fileRef = useRef(null);
  // Body
  const [sonne, setSonne] = useState({ T:false, O:false });
  const [sonneDur, setSonneDur] = useState({ T:0, O:0 });
  const [ankle, setAnkle] = useState({ schmerz:5, schwellung:5, mobilitaet:5, notes:'' });
  const [antiInf, setAntiInf] = useState({});
  // Daily toggles
  const [toggles, setToggles] = useState({ noCarb:false, screenFree:false, morningSun:false });
  // Ritual
  const [ritual, setRitual] = useState({ wasser:false, gruentee:false, supps:false, kaffee:false });
  // Health sub-tab
  const [hs, setHs] = useState('morgen');
  // Calendar AI
  const [calMsg, setCalMsg] = useState('');
  const [calLoading, setCalLoading] = useState(false);
  const [calResult, setCalResult] = useState(null);
  const [calEvents, setCalEvents] = useState([]);
  // Avatar
  const [avatarT, setAvatarT] = useState({ skinTone:'#D4A574', hairColor:'#2C1810', hairStyle:'long', outfitColor:'#C9A84C', accessory:'none' });
  const [avatarO, setAvatarO] = useState({ skinTone:'#D4A574', hairColor:'#2C1810', hairStyle:'short', outfitColor:'#4A90D9', accessory:'dog' });
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(null);
  // Sleep history + notifications
  const [sleepHistory, setSleepHistory] = useState([]);
  const [notifGranted, setNotifGranted] = useState(false);
  const [selWeekDay, setSelWeekDay] = useState(null);
  // Runde 3 features
  const [showXpBreakdown, setShowXpBreakdown] = useState(false);
  const [showCycleDetail, setShowCycleDetail] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weeklyReview, setWeeklyReview] = useState('');
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [universalKI, setUniversalKI] = useState('');
  const [universalKIResult, setUniversalKIResult] = useState('');
  const [universalKILoading, setUniversalKILoading] = useState(false);
  const [dayCompare, setDayCompare] = useState(null); // for day comparison view
  const [freeNote, setFreeNote] = useState(''); // global free note

  // ─── LOAD DATA ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    (async () => {
      const all = await loadAllData();
      const g = (k, d) => all[k] ?? d;
      setDone(g(`done_${dkey}`, {})); setCustom(g('custom', []));
      setXpT(g('xp_t', 0)); setXpO(g('xp_o', 0)); setStreak(g('streak', 0));
      setRoute(g(`route_${dkey}`, null));
      setSuppT(g(`supp_t_${dkey}`, {})); setMedO(g(`med_o_${dkey}`, {}));
      setMindT(g(`mind_t_${dkey}`, M0())); setMindO(g(`mind_o_${dkey}`, M0()));
      setSlp(g(`slp_${dkey}`, { T:{bed:'',wake:'',q:0,notes:''}, O:{bed:'',wake:'',q:0,notes:''} }));
      setDrinks(g(`drinks_${dkey}`, [])); setCannabis(g(`can_${dkey}`, []));
      setFood(g(`food_${dkey}`, [])); setTafilPrn(g(`tafil_prn_${dkey}`, 0));
      setSuppOExtra(g('supp_o_extra', []));
      setAnkle(g(`ankle_${dkey}`, { schmerz:5, schwellung:5, mobilitaet:5, notes:'' }));
      setAntiInf(g(`antiinf_${dkey}`, {})); setSonne(g(`sonne_${dkey}`, { T:false, O:false }));
      setToggles(g(`toggles_${dkey}`, { noCarb:false, screenFree:false, morningSun:false }));
      setRitual(g(`ritual_${dkey}`, { wasser:false, gruentee:false, supps:false, kaffee:false }));
      setMeals(g(`meals_${dkey}`, { morgen:false, mittag:false, kaffee:false, abend:false }));
      setCheatDay(g(`cheatday_${dkey}`, false));
      setWaterGlasses(g(`water_${dkey}`, { T:0, O:0 }));
      setAvatarT(g('avatar_t', { skinTone:'#D4A574', hairColor:'#2C1810', hairStyle:'long', outfitColor:'#C9A84C', accessory:'none' }));
      setAvatarO(g('avatar_o', { skinTone:'#D4A574', hairColor:'#2C1810', hairStyle:'short', outfitColor:'#4A90D9', accessory:'dog' }));
      // Load calendar events
      try {
        const calRes = await fetch('/api/calendar');
        if (calRes.ok) { const cd = await calRes.json(); setCalEvents(cd.events || []); }
      } catch {}
      // Load sleep history (last 7 days)
      const hist = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dk2 = d.toISOString().split('T')[0];
        const s = all[`slp_${dk2}`];
        if (s) hist.push({ date: d, dateKey: dk2, ...s });
      }
      setSleepHistory(hist);
      // Load weather
      try {
        const wRes = await fetch('/api/weather');
        if (wRes.ok) setWeather(await wRes.json());
      } catch {}
      // Load free note
      setFreeNote(all[`freenote_${dkey}`] || '');
      setReady(true);
    })();
  }, [session]);

  // Setup service worker + notifications
  useEffect(() => {
    if (!session) return;
    (async () => {
      await registerSW();
      const granted = await requestNotificationPermission();
      setNotifGranted(granted);
      if (granted) {
        const medsAlreadyTaken = !!medO['bupro'] && !!medO['tafil_m'];
        scheduleDailyReminders(medsAlreadyTaken);
      }
    })();
  }, [session]);

  // Real-time sync
  useEffect(() => {
    if (!session) return;
    const sub = subscribeToChanges(payload => {
      const { data_key: k, data_value: v } = payload.new || {};
      if (!k) return;
      if (k === `done_${dkey}`) setDone(v);
      else if (k === 'xp_t') setXpT(v);
      else if (k === 'xp_o') setXpO(v);
      else if (k === 'streak') setStreak(v);
      else if (k === `drinks_${dkey}`) setDrinks(v);
      else if (k === `can_${dkey}`) setCannabis(v);
      else if (k === `food_${dkey}`) setFood(v);
      else if (k === `mind_t_${dkey}`) setMindT(v);
      else if (k === `mind_o_${dkey}`) setMindO(v);
      else if (k === `slp_${dkey}`) setSlp(v);
      else if (k === `supp_t_${dkey}`) setSuppT(v);
      else if (k === `med_o_${dkey}`) setMedO(v);
      else if (k === `toggles_${dkey}`) setToggles(v);
      else if (k === `ritual_${dkey}`) setRitual(v);
      else if (k === `meals_${dkey}`) setMeals(v);
      else if (k === `water_${dkey}`) setWaterGlasses(v);
      else if (k === `antiinf_${dkey}`) setAntiInf(v);
      else if (k === `ankle_${dkey}`) setAnkle(v);
      else if (k === `sonne_${dkey}`) setSonne(v);
      else if (k === `tafil_prn_${dkey}`) setTafilPrn(v);
      else if (k === 'custom') setCustom(v);
      else if (k === 'avatar_t') setAvatarT(v);
      else if (k === 'avatar_o') setAvatarO(v);
    });
    return () => sub?.unsubscribe();
  }, [session]);

  const showFlash = msg => { setFlash(msg); setTimeout(() => setFlash(null), 1500); };

  // Derived
  const showDay = tab === 'woche' ? selDay : dk;
  const allTasks = [...(SCHED[showDay]||[]), ...custom.filter(c => c.day === showDay)];
  const doneCount = allTasks.filter(t => done[t.id]).length;
  const progress = allTasks.length ? doneCount / allTasks.length : 0;
  const lvlT = getLvl(xpT), lvlO = getLvl(xpO);
  const minsTo11 = hr < 11 ? (11-hr-1)*60+(60-min) : 0;
  const past11 = hr >= 11;
  const tafilToday = !!medO['tafil_m'] || tafilPrn > 0;
  const alcToday = drinks.some(d => isAlc(d.k));
  const warnings = [];
  if (tafilToday && alcToday) warnings.push({ col:P.red, txt:'🔴 KRITISCH: Tafil + Alkohol heute! Sehr vorsichtig sein.' });
  if (alcToday && cycle.noAlc) warnings.push({ col:P.red, txt:`🚫 ${cycle.name}: Kein Alkohol-Tag!` });
  if (cannabis.length > 0 && tafilToday) warnings.push({ col:P.orange, txt:'🟡 Cannabis + Tafil: Doppelt dämpfend.' });
  const waterT_ml = waterGlasses.T * WATER_GLASS;
  const waterO_ml = waterGlasses.O * WATER_GLASS;
  const foodTot = food.reduce((a,f) => {
    const n = f.ai||{}; return { cal:a.cal+(n.calories||0), prot:a.prot+(n.protein_g||0), carbs:a.carbs+(n.carbs_g||0), vitC:a.vitC+(n.vitamin_c_mg||0), iron:a.iron+(n.iron_mg||0), mag:a.mag+(n.magnesium_mg||0) };
  }, { cal:0, prot:0, carbs:0, vitC:0, iron:0, mag:0 });
  const mealsChecked = Object.values(meals).filter(Boolean).length;
  const mind = mindTab === 'T' ? mindT : mindO;
  const mindScore = (Object.values(mind).reduce((a,v)=>a+v,0)/MIND_CATS.length).toFixed(1);

  // ─── ACTIONS ───────────────────────────────────────────────────────────────
  async function toggle(task) {
    const was = done[task.id], nd = {...done}, xp = task.xp||0;
    if (was) delete nd[task.id]; else nd[task.id] = true;
    const m = was?-1:1, nT = task.p!=='O'?Math.max(0,xpT+xp*m):xpT, nO = task.p!=='T'?Math.max(0,xpO+xp*m):xpO;
    setDone(nd); setXpT(nT); setXpO(nO);
    await Promise.all([saveData(`done_${dkey}`,nd), saveData('xp_t',nT), saveData('xp_o',nO)]);
    if (!was && xp > 0) showFlash(`+${xp} XP`);
  }

  async function addTask() {
    if (!taskIn.trim()) return;
    const t = {id:`c${Date.now()}`,time:'—',text:taskIn.trim(),p:'BOTH',cat:'PAUSE',xp:1,day:showDay,custom:true};
    const u = [...custom,t]; setCustom(u); setTaskIn(''); await saveData('custom',u);
  }

  async function toggleMeal(k) {
    const n = {...meals,[k]:!meals[k]}; setMeals(n); await saveData(`meals_${dkey}`,n);
    if (!meals[k]) showFlash(`✓ ${MEAL_SLOTS.find(s=>s.id===k)?.label}`);
  }

  async function changeWater(who, d) {
    const n = {...waterGlasses,[who]:Math.max(0,waterGlasses[who]+d)};
    setWaterGlasses(n); await saveData(`water_${dkey}`,n);
    if (d > 0 && n[who] * WATER_GLASS >= (who==='T'?WATER_T:WATER_O)) showFlash('💧 Wasserziel! +3 XP');
  }

  async function addDrink() {
    const def = DRINKS_DEF.find(d => d.k === drinkForm.k); if (!def) return;
    let xp = def.xp;
    if (isAlc(drinkForm.k) && cycle.noAlc) xp *= 2;
    const e = {id:`dr${Date.now()}`,time:`${String(hr).padStart(2,'0')}:${String(min).padStart(2,'0')}`, ...drinkForm, xp, label:def.l, emoji:def.e};
    const u = [...drinks,e]; setDrinks(u);
    const nT = drinkForm.p!=='O'?Math.max(0,xpT+xp):xpT, nO = drinkForm.p!=='T'?Math.max(0,xpO+xp):xpO;
    setXpT(nT); setXpO(nO);
    await Promise.all([saveData(`drinks_${dkey}`,u), saveData('xp_t',nT), saveData('xp_o',nO)]);
    showFlash(`${def.e} ${xp>=0?'+':''}${xp} XP`);
  }

  async function addFoodText() {
    if (!foodIn.trim()) return;
    setAnalyzing(true);
    try {
      const ai = await analyzeFoodText(foodIn);
      const e = {id:`f${Date.now()}`,time:`${String(hr).padStart(2,'0')}:${String(min).padStart(2,'0')}`,desc:foodIn,ai};
      setFood(prev => { const u=[...prev,e]; saveData(`food_${dkey}`,u); return u; });
      setFoodIn('');
      showFlash(`🍽️ ${ai.name || 'Analysiert!'} · Score: ${ai.score || '?'}/100`);
    } catch(err) {
      console.error('Food error:', err);
      showFlash('❌ Analyse fehlgeschlagen — ANTHROPIC_API_KEY prüfen');
    }
    setAnalyzing(false);
  }

  async function handlePhoto(ev) {
    const file = ev.target.files?.[0]; if (!file) return;
    ev.target.value = '';
    setAnalyzing(true);
    showFlash('📸 Foto wird analysiert…');
    try {
      const b64 = await new Promise((res,rej) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result.split(',')[1]);
        reader.onerror = () => rej(new Error('Lesefehler'));
        reader.readAsDataURL(file);
      });
      const ai = await analyzeFoodPhoto(b64, file.type, foodIn);
      const entry = {id:`f${Date.now()}`,time:`${String(hr).padStart(2,'0')}:${String(min).padStart(2,'0')}`,desc:foodIn||ai.name||'Foto-Mahlzeit',ai,photo:true};
      setFood(prev => { const u=[...prev,entry]; saveData(`food_${dkey}`,u); return u; });
      setFoodIn('');
      showFlash(`✅ ${ai.name || 'Analysiert!'} · Score: ${ai.score || '?'}/100`);
    } catch(err) {
      console.error('Photo error:', err);
      showFlash('❌ Foto-Analyse fehlgeschlagen');
    }
    setAnalyzing(false);
  }

  async function deleteFood(id) {
    setFood(prev => { const u=prev.filter(f=>f.id!==id); saveData(`food_${dkey}`,u); return u; });
    showFlash('🗑️ Gelöscht');
  }

  async function deleteDrink(id) {
    const drink = drinks.find(d=>d.id===id);
    setDrinks(prev => { const u=prev.filter(d=>d.id!==id); saveData(`drinks_${dkey}`,u); return u; });
    if (drink) {
      const nT = drink.p!=='O' ? Math.max(0,xpT-drink.xp) : xpT;
      const nO = drink.p!=='T' ? Math.max(0,xpO-drink.xp) : xpO;
      setXpT(nT); setXpO(nO);
      await Promise.all([saveData('xp_t',nT), saveData('xp_o',nO)]);
    }
    showFlash('🗑️ Gelöscht');
  }

  async function deleteCannabis(id) {
    setCannabis(prev => { const u=prev.filter(c=>c.id!==id); saveData(`can_${dkey}`,u); return u; });
    showFlash('🗑️ Gelöscht');
  }

  async function deleteCustomTask(id) {
    const u = custom.filter(c=>c.id!==id);
    setCustom(u);
    await saveData('custom', u);
    showFlash('🗑️ Aufgabe gelöscht');
  }

  async function chgXp(w, d) {
    if (w==='T') { const n=Math.max(0,xpT+d); setXpT(n); await saveData('xp_t',n); }
    else { const n=Math.max(0,xpO+d); setXpO(n); await saveData('xp_o',n); }
  }

  async function sendCalMsg() {
    if (!calMsg.trim()) return; setCalLoading(true); setCalResult(null);
    try {
      const data = await planCalendar(calMsg, calEvents); setCalResult(data);
      // Execute calendar actions
      for (const action of data.actions || []) {
        if (action.type === 'create_event') {
          await fetch('/api/calendar', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(action) });
        }
      }
      if (data.actions?.length) {
        const calRes = await fetch('/api/calendar');
        if (calRes.ok) { const cd = await calRes.json(); setCalEvents(cd.events||[]); }
      }
      setCalMsg('');
    } catch(e) { console.error(e); }
    setCalLoading(false);
  }

  async function saveAvatar(who, config) {
    const key = who==='T'?'avatar_t':'avatar_o';
    if (who==='T') { setAvatarT(config); await saveData(key,config); }
    else { setAvatarO(config); await saveData(key,config); }
  }

  // Universal KI helper
  async function askUniversalKI() {
    if (!universalKI.trim()) return;
    setUniversalKILoading(true); setUniversalKIResult('');
    try {
      const result = await askAI(universalKI);
      setUniversalKIResult(typeof result === 'string' ? result : JSON.stringify(result));
    } catch(err) { setUniversalKIResult('❌ ' + err.message); }
    setUniversalKILoading(false);
  }

  // Weekly review
  async function loadWeeklyReview() {
    setWeeklyLoading(true);
    try {
      const result = await getWeeklyReview({
        tasksTotal: doneCount, tasksMax: allTasks.length,
        streak, xpT, xpO,
        suppDays: Object.keys(suppT).length > 0 ? 5 : 0,
        medDays: Object.keys(medO).length > 0 ? 5 : 0,
        sleepT: sleepHistory.length > 0 ? '7' : '?',
        sleepO: sleepHistory.length > 0 ? '6.5' : '?',
        cheatDays: 0, contentItems: 0,
        gassiCount: allTasks.filter(t => t.cat === 'GASSI' && done[t.id]).length,
        waterT: waterGlasses.T, waterO: waterGlasses.O,
        cannabisTotal: cannabis.length,
      });
      setWeeklyReview(typeof result === 'string' ? result : result?.review || 'Kein Rückblick verfügbar');
    } catch(err) { setWeeklyReview('❌ ' + err.message); }
    setWeeklyLoading(false);
  }

  if (status === 'loading' || !ready) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:P.bg, color:P.gold, fontSize:18, letterSpacing:3 }}>LADEN…</div>
  );

  return (
    <div style={{ background:P.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', position:'relative', fontFamily:"'Segoe UI',sans-serif" }}>

      {/* Flash */}
      {flash && <div className="flash-anim" style={{ position:'fixed', top:'42%', left:'50%', transform:'translate(-50%,-50%)', background:P.gold, color:'#000', fontWeight:700, fontSize:20, padding:'12px 26px', borderRadius:14, zIndex:999, letterSpacing:1 }}>{flash}</div>}

      {/* Drug warnings */}
      {warnings.map((w,i) => <div key={i} style={{ background:w.col+'22', borderBottom:`1px solid ${w.col}`, padding:'9px 14px', fontSize:11, color:w.col, fontWeight:600 }}>{w.txt}</div>)}

      {/* HEADER */}
      <div style={{ background:'linear-gradient(160deg,#1A2744,#080F1E)', borderBottom:`1px solid ${P.goldDim}`, padding:'14px 16px 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ color:P.gold, fontSize:8, letterSpacing:4, fontWeight:700, marginBottom:3 }}>
              RIVIERA PLANNER · {session?.user?.name?.split(' ')[0]?.toUpperCase() || who}
            </div>
            <div style={{ fontSize:11, color:P.muted }}>{dateStr}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ background:cycle.color+'33', border:`1px solid ${cycle.color}66`, borderRadius:9, padding:'4px 8px', textAlign:'right' }}>
              <div style={{ fontSize:15 }}>{cycle.emoji} {moon}</div>
              <div style={{ fontSize:8, color:P.muted }}>{cycle.name} · T.{cycle.day}</div>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              {!notifGranted && (
                <button onClick={async()=>{const ok=await requestNotificationPermission();setNotifGranted(ok);if(ok){scheduleDailyReminders(!!medO['bupro']&&!!medO['tafil_m']);}}} style={{ background:P.orange+'22', border:`1px solid ${P.orange}55`, borderRadius:8, padding:'4px 8px', color:P.orange, fontSize:9, cursor:'pointer', fontWeight:700 }}>🔔 AN</button>
              )}
              {notifGranted && <span style={{ fontSize:16 }}>🔔</span>}
              <button onClick={() => signOut({ callbackUrl:'/' })} style={{ background:'transparent', border:`1px solid ${P.border}`, borderRadius:8, padding:'4px 8px', color:P.muted, fontSize:10, cursor:'pointer' }}>⏏</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop:8 }}>
          <div style={{ height:3, background:'#1E3055', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress*100}%`, background:`linear-gradient(90deg,${P.goldDim},${P.gold})`, transition:'width 0.4s' }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
            <span style={{ fontSize:8.5, color:P.muted }}>{doneCount}/{allTasks.length} Tasks · {mealsChecked}/4 Mahlzeiten</span>
            <span style={{ fontSize:8.5, color:P.muted }}>T:{xpT}XP · O:{xpO}XP · 🔥{streak}</span>
          </div>
        </div>
      </div>

      {/* TABS — scrollable so all 5 fit on mobile */}
      <div style={{ display:'flex', background:'#080F1E', borderBottom:`1px solid ${P.border}`, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        {[['heute','🏠 HEUTE'],['health','💊 HEALTH'],['woche','📅 WOCHE'],['content','📱 CONTENT'],['avatar','🎮 AVATAR']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flexShrink:0, padding:'12px 14px', background:'none', border:'none', cursor:'pointer', color:tab===k?P.gold:P.muted, borderBottom:tab===k?`2px solid ${P.gold}`:'2px solid transparent', fontSize:10, fontWeight:700, letterSpacing:0.5, whiteSpace:'nowrap' }}>{l}</button>
        ))}
      </div>

      <div style={{ padding:'10px 10px 90px' }}>

        {/* ══════════════════════════════════════════════════════ HEUTE */}
        {tab === 'heute' && <>
          {/* Cycle card — KLICKBAR für Details */}
          <div onClick={()=>setShowCycleDetail(!showCycleDetail)} style={{ background:cycle.color+'1A', border:`1px solid ${cycle.color}55`, borderRadius:10, padding:12, marginBottom:8, cursor:'pointer' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:cycle.color, marginBottom:4 }}>{cycle.emoji} {cycle.name} — Tag {cycle.day}/28 · {moon}</div>
                <div style={{ fontSize:11, marginBottom:3 }}>🍽️ <b>Heute:</b> {cycle.food}</div>
                <div style={{ fontSize:10, color:P.muted, fontStyle:'italic' }}>{cycle.tip}</div>
                {cycle.noAlc && <div style={{ marginTop:5, fontSize:10, color:P.red, fontWeight:700 }}>🚫 KEIN ALKOHOL · 💊 Magnesium {cycle.mag}x</div>}
              </div>
              <span style={{ fontSize:11, color:cycle.color, marginLeft:8 }}>{showCycleDetail?'▲':'▼'}</span>
            </div>
            {/* Detail expandable */}
            {showCycleDetail && (
              <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${cycle.color}44` }}>
                <div style={{ fontSize:10, fontWeight:700, color:P.muted, marginBottom:8 }}>ALLE 4 PHASEN</div>
                {[
                  {n:'🩸 Menstruation',d:'Tag 1-5',t:'Wärme, Ruhe, Eisen, Protein. Kein Alkohol.'},
                  {n:'✨ Follikelphase',d:'Tag 6-13',t:'Beste Abnehmphase! Energie steigt. Neue Projekte.'},
                  {n:'⚡ Eisprung',d:'Tag 14',t:'Peak-Energie! OPC doppelt. Kein Alkohol.'},
                  {n:'🌿 Lutealphase',d:'Tag 15-28',t:'Heißhunger? Dunkle Schoki >70% ok. Magnesium 2x.'},
                ].map((p,i)=>(
                  <div key={i} style={{ marginBottom:8, padding:'8px', background:`${cycle.color}11`, borderRadius:8 }}>
                    <div style={{ fontSize:11, fontWeight:700 }}>{p.n} <span style={{ fontSize:9, color:P.muted }}>({p.d})</span></div>
                    <div style={{ fontSize:10, color:P.muted, marginTop:2 }}>{p.t}</div>
                  </div>
                ))}
                <div style={{ marginTop:8 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:P.muted, marginBottom:4 }}>MONDPHASE</div>
                  <div style={{ fontSize:11 }}>{moon} — {['🌑 Neumond','🌒','🌓 Erstes Viertel','🌔','🌕 Vollmond','🌖','🌗 Letztes Viertel','🌘'].find(()=>true)}</div>
                  <div style={{ fontSize:10, color:P.muted, marginTop:2 }}>Vollmond verstärkt Emotionen · Neumond = Neuanfänge</div>
                </div>
              </div>
            )}
          </div>

          {/* Weather + Waves widget */}
          {weather && !weather.error && (
            <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:8, border:`1px solid ${P.blue}33` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ fontSize:10, fontWeight:700, color:P.oli, letterSpacing:1 }}>🌊 WETTER & WELLEN — Côte d'Azur</div>
                <div style={{ fontSize:9, color:P.muted }}>Aktuell {weather.updated}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                {/* Weather */}
                <div style={{ background:P.raised, borderRadius:10, padding:10, textAlign:'center' }}>
                  <div style={{ fontSize:32 }}>{weather.weather.emoji}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:P.white }}>{weather.weather.temp}°C</div>
                  <div style={{ fontSize:10, color:P.muted }}>{weather.weather.desc}</div>
                  <div style={{ fontSize:9, color:P.muted, marginTop:4 }}>💨 {weather.weather.wind_kmh}km/h {weather.weather.wind_dir} · UV {weather.weather.uv}</div>
                </div>
                {/* Waves */}
                <div style={{ background:P.raised, borderRadius:10, padding:10, textAlign:'center' }}>
                  <div style={{ fontSize:28 }}>{weather.waves.rating?.emoji || '🌊'}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:weather.waves.rating?.color || P.blue }}>{weather.waves.height_m}m</div>
                  <div style={{ fontSize:10, color:weather.waves.rating?.color || P.blue, fontWeight:700 }}>{weather.waves.rating?.label}</div>
                  <div style={{ fontSize:9, color:P.muted, marginTop:4 }}>Periode: {weather.waves.period_s}s · {weather.waves.direction}</div>
                </div>
              </div>
              {/* Swell detail */}
              <div style={{ background:P.raised, borderRadius:8, padding:'8px 10px', display:'flex', justifyContent:'space-between' }}>
                <div><div style={{ fontSize:9, color:P.muted }}>Dünung heute</div><div style={{ fontSize:11, fontWeight:700, color:P.blue }}>{weather.waves.swell_height}m / {weather.waves.swell_period}s</div></div>
                <div><div style={{ fontSize:9, color:P.muted }}>Max heute</div><div style={{ fontSize:11, fontWeight:700, color:P.blue }}>{weather.waves.max_today}m</div></div>
                <div><div style={{ fontSize:9, color:P.muted }}>Max morgen</div><div style={{ fontSize:11, fontWeight:700, color:P.blue }}>{weather.waves.max_tomorrow}m</div></div>
              </div>
              <div style={{ fontSize:8.5, color:P.muted, marginTop:6, textAlign:'center' }}>{weather.tide}</div>
            </div>
          )}

          {/* Morning ritual */}
          <div style={{ background:P.card, borderRadius:10, padding:10, marginBottom:8, border:`1px solid ${P.goldDim}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:P.gold, letterSpacing:2, marginBottom:8 }}>🌅 MORGEN-RITUAL</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {[['wasser','💧 Wasser + Zitrone'],['gruentee','🍵 Grüntee + Ingwer'],['supps','💊 Supplements'],['kaffee','☕ Kaffee + Kollagen']].map(([k,l]) => (
                <div key={k} onClick={async () => { const n={...ritual,[k]:!ritual[k]}; setRitual(n); await saveData(`ritual_${dkey}`,n); if(!ritual[k]) showFlash('+0.5 XP 🌅'); }}
                  style={{ background:ritual[k]?P.green+'22':P.raised, border:`1px solid ${ritual[k]?P.green:P.border}`, borderRadius:8, padding:'9px 8px', cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:11, color:ritual[k]?P.green:P.muted }}>{l}</div>
                  {ritual[k] && <div style={{ fontSize:10, color:P.green, fontWeight:700 }}>✓</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Daily toggles */}
          <div style={{ background:P.card, borderRadius:10, padding:10, marginBottom:8, border:`1px solid ${P.border}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:P.gold, letterSpacing:2, marginBottom:7 }}>TAGES-GOALS</div>
            <div style={{ display:'flex', gap:6 }}>
              {[['noCarb','🚫','No-Carb 16h'],['screenFree','📵','Screen-free 21h'],['morningSun','🌞','Morgensonne']].map(([k,e,l]) => (
                <div key={k} onClick={async () => { const n={...toggles,[k]:!toggles[k]}; setToggles(n); await saveData(`toggles_${dkey}`,n); if(!toggles[k]) showFlash('+1 XP'); }}
                  style={{ flex:1, background:toggles[k]?P.green+'22':P.raised, border:`1px solid ${toggles[k]?P.green:P.border}`, borderRadius:8, padding:'8px 4px', cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:20 }}>{e}</div>
                  <div style={{ fontSize:8, color:toggles[k]?P.green:P.muted, marginTop:3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gassi route */}
          <div style={{ background:P.card, borderRadius:10, padding:10, marginBottom:8, border:`1px solid ${P.border}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:P.gold, letterSpacing:2, marginBottom:7 }}>🐾 CHICO & SUNNY — ROUTE</div>
            <div style={{ display:'flex', gap:6 }}>
              {[['meer','🌊','Meer'],['park','🌳','Park'],['hinterland','🏔️','Hinterland']].map(([k,e,l]) => (
                <button key={k} onClick={async () => { const n=route===k?null:k; setRoute(n); await saveData(`route_${dkey}`,n); }}
                  style={{ flex:1, padding:'8px 2px', borderRadius:8, border:`1px solid ${route===k?P.gold:P.border}`, cursor:'pointer', background:route===k?P.gold+'33':P.raised, color:route===k?P.goldFg:P.muted, textAlign:'center' }}>
                  <div style={{ fontSize:18 }}>{e}</div><div style={{ fontSize:8 }}>{l}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Google Calendar events today + upcoming */}
          {calEvents.length > 0 && (() => {
            const todayEvents = calEvents.filter(ev => {
              const evDate = new Date(ev.start?.dateTime || ev.start?.date);
              return evDate.toDateString() === now.toDateString();
            });
            const upcomingEvs = calEvents.filter(ev => {
              const evDate = new Date(ev.start?.dateTime || ev.start?.date);
              return evDate > now && evDate.toDateString() !== now.toDateString();
            }).slice(0,3);
            if (!todayEvents.length && !upcomingEvs.length) return null;
            return (
              <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:8, border:`1px solid #4A90D933` }}>
                <div style={{ fontSize:10, fontWeight:700, color:P.oli, letterSpacing:1, marginBottom:8 }}>📅 DEIN KALENDER</div>
                {todayEvents.length > 0 && <>
                  <div style={{ fontSize:9, color:P.muted, marginBottom:5 }}>HEUTE</div>
                  {todayEvents.map((ev,i) => {
                    const t = ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}) : 'Ganztag';
                    return (
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'7px 0', borderBottom:'1px solid #0F1829' }}>
                        <span style={{ fontSize:10, color:P.gold, fontWeight:700, minWidth:36 }}>{t}</span>
                        <span style={{ fontSize:12, fontWeight:600 }}>{ev.summary}</span>
                      </div>
                    );
                  })}
                </>}
                {upcomingEvs.length > 0 && <>
                  <div style={{ fontSize:9, color:P.muted, marginTop:8, marginBottom:5 }}>DEMNÄCHST</div>
                  {upcomingEvs.map((ev,i) => {
                    const d = new Date(ev.start?.dateTime || ev.start?.date);
                    const dateLabel = d.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'});
                    const timeLabel = ev.start?.dateTime ? ' · ' + d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}) : '';
                    return (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #0F1829' }}>
                        <span style={{ fontSize:11 }}>{ev.summary}</span>
                        <span style={{ fontSize:9, color:P.muted, flexShrink:0 }}>{dateLabel}{timeLabel}</span>
                      </div>
                    );
                  })}
                </>}
              </div>
            );
          })()}

          {/* Upcoming Monaco events */}
          {(() => {
            const upcoming = MONACO_EVENTS.filter(e => new Date(e.date) > now && new Date(e.date) < new Date(now.getTime() + 45*24*60*60*1000));
            if (!upcoming.length) return null;
            return (
              <div style={{ background:P.card, borderRadius:10, padding:10, marginBottom:8, border:`1px solid ${P.oli}33` }}>
                <div style={{ fontSize:9, fontWeight:700, color:P.oli, letterSpacing:2, marginBottom:7 }}>🎯 MONACO — NÄCHSTE EVENTS</div>
                {upcoming.slice(0,3).map(ev => {
                  const daysUntil = Math.ceil((new Date(ev.date) - now) / (1000*60*60*24));
                  return (
                    <div key={ev.date} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #0F1829' }}>
                      <span style={{ fontSize:12 }}>{ev.emoji} {ev.name}</span>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:9, color:ev.important?P.gold:P.muted }}>{new Date(ev.date).toLocaleDateString('de-DE',{day:'numeric',month:'short'})}</div>
                        <div style={{ fontSize:8, color:daysUntil<=14?P.orange:P.muted }}>{daysUntil}d</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Tasks */}
          <TaskList tasks={allTasks} done={done} onToggle={toggle} />

          {/* Add task */}
          <div style={{ background:P.card, borderRadius:10, padding:10, marginTop:8, border:`1px solid ${P.border}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:P.gold, letterSpacing:2, marginBottom:6 }}>+ EIGENE AUFGABE</div>
            <div style={{ display:'flex', gap:6 }}>
              <input value={taskIn} onChange={e=>setTaskIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="Aufgabe…" style={inp}/>
              <button onClick={addTask} style={{ background:P.gold, border:'none', borderRadius:8, padding:'0 16px', color:'#000', fontWeight:700, fontSize:18, cursor:'pointer' }}>+</button>
            </div>
          </div>

          {/* Calendar AI box */}
          <div style={{ background:P.card, borderRadius:10, padding:12, marginTop:8, border:`1px solid ${P.oli}33` }}>
            <div style={{ fontSize:9, fontWeight:700, color:P.oli, letterSpacing:2, marginBottom:6 }}>🗓️ KI-KALENDERPLANUNG</div>
            <div style={{ fontSize:9.5, color:P.muted, marginBottom:8 }}>Schreib was sich ändert — ich plane es ein und trag es in deinen Google Kalender ein.</div>
            <textarea value={calMsg} onChange={e=>setCalMsg(e.target.value)} placeholder='z.B. "Physio Dienstag 10:00 und Donnerstag 14:00, je 2,5h mit Anfahrt" oder "Zahnarzt verschiebt sich auf Montag 15h"'
              style={{ ...inp, height:70, resize:'none', marginBottom:8 }} />
            <button onClick={sendCalMsg} disabled={calLoading||!calMsg.trim()} style={{ width:'100%', padding:'10px', background:calLoading?P.muted+'22':P.oli+'22', border:`1px solid ${P.oli}55`, borderRadius:8, color:calLoading?P.muted:P.oli, fontWeight:700, cursor:'pointer', fontSize:12 }}>
              {calLoading ? '🤖 Plane ein…' : '🤖 In Kalender eintragen'}
            </button>
            {calResult && (
              <div style={{ marginTop:10, background:P.raised, borderRadius:8, padding:10 }}>
                <div style={{ fontSize:11, color:P.green, marginBottom:6, fontWeight:700 }}>✓ {calResult.message}</div>
                {calResult.conflicts?.map((c,i) => <div key={i} style={{ fontSize:10, color:P.orange }}>⚠️ {c}</div>)}
                {calResult.suggestions?.map((s,i) => <div key={i} style={{ fontSize:10, color:P.muted }}>💡 {s}</div>)}
              </div>
            )}
            {calEvents.length > 0 && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:9, color:P.muted, marginBottom:5 }}>NÄCHSTE KALENDER-TERMINE</div>
                {calEvents.slice(0,4).map((ev,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #111C2A' }}>
                    <span style={{ fontSize:11 }}>{ev.summary}</span>
                    <span style={{ fontSize:9, color:P.muted }}>{ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleDateString('de-DE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ev.start?.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Free Note — tägliche Notiz */}
          <div style={{ background:P.card, borderRadius:10, padding:12, marginTop:8, border:`1px solid ${P.border}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:P.gold, letterSpacing:2, marginBottom:6 }}>📝 TAGES-NOTIZ (frei)</div>
            <textarea value={freeNote} onChange={async e=>{setFreeNote(e.target.value);await saveData(`freenote_${dkey}`,e.target.value);}} placeholder="Wie war dein Tag? Was ist aufgefallen? Gedanken, Ideen, Gefühle…" style={{ background:P.raised, border:`1px solid ${P.border}`, borderRadius:8, padding:'9px 12px', color:P.white, fontSize:12, outline:'none', width:'100%', height:80, resize:'none' }}/>
          </div>

          {/* Universal KI box */}
          <div style={{ background:P.card, borderRadius:10, padding:12, marginTop:8, border:`1px solid ${P.purple}33` }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#B794F4', letterSpacing:2, marginBottom:6 }}>🤖 FRAG DIE KI — ALLES</div>
            <div style={{ fontSize:10, color:P.muted, marginBottom:8 }}>Frag mich alles: Gesundheit, Planung, Rezepte, Motivation, Tipps für Tanja & Oli.</div>
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              <input value={universalKI} onChange={e=>setUniversalKI(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askUniversalKI()} placeholder="Stell mir eine Frage…" style={{ flex:1, background:P.raised, border:`1px solid ${P.border}`, borderRadius:8, padding:'9px 12px', color:P.white, fontSize:12, outline:'none' }}/>
              <button onClick={askUniversalKI} disabled={universalKILoading||!universalKI.trim()} style={{ padding:'0 14px', background:'#B794F422', border:'1px solid #B794F455', borderRadius:8, color:'#B794F4', fontWeight:700, cursor:'pointer', fontSize:14 }}>→</button>
            </div>
            {universalKILoading && <div style={{ fontSize:11, color:P.muted, textAlign:'center' }}>🤖 Denkt nach…</div>}
            {universalKIResult && (
              <div style={{ background:P.raised, borderRadius:8, padding:10, fontSize:12, lineHeight:1.7, color:P.white }}>
                {universalKIResult}
                <button onClick={()=>{setUniversalKI('');setUniversalKIResult('');}} style={{ display:'block', marginTop:8, fontSize:9, color:P.muted, background:'transparent', border:'none', cursor:'pointer' }}>✕ Schließen</button>
              </div>
            )}
          </div>

          {/* Quick nav to Business */}
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <button onClick={()=>window.location.href='/business'} style={{ flex:1, padding:'10px', background:P.tanja+'22', border:`1px solid ${P.tanja}55`, borderRadius:10, color:P.tanja, fontWeight:700, cursor:'pointer', fontSize:12 }}>💼 tamosique Business</button>
            <button onClick={()=>window.location.href='/business'} style={{ flex:1, padding:'10px', background:P.oli+'22', border:`1px solid ${P.oli}55`, borderRadius:10, color:P.oli, fontWeight:700, cursor:'pointer', fontSize:12 }}>🎯 M.O.C. Business</button>
          </div>
        </>}

        {/* ══════════════════════════════════════════════════════ HEALTH */}
        {tab === 'health' && <>
          <div style={{ display:'flex', gap:5, marginBottom:10, overflowX:'auto', paddingBottom:2 }}>
            {[['morgen','🌅'],['essen','🍽️'],['trinken','💧'],['schlaf','🌙'],['mind','🧠'],['supp','💊'],['cannabis','🌿'],['body','☀️']].map(([k,e]) => (
              <button key={k} onClick={()=>setHs(k)} style={{ flexShrink:0, padding:'7px 12px', borderRadius:20, border:'none', cursor:'pointer', background:hs===k?P.gold:'#1E3055', color:hs===k?'#000':P.muted, fontSize:11, fontWeight:700 }}>{e}</button>
            ))}
          </div>

          {/* MORGEN DETAIL */}
          {hs === 'morgen' && (
            <div style={{ background:P.card, borderRadius:10, padding:12, border:`1px solid ${P.gold}33` }}>
              <div style={{ fontWeight:700, fontSize:13, color:P.gold, marginBottom:10 }}>🌅 Morgen-Ritual Check</div>
              {[['wasser','💧 0,5L Wasser + Zitrone (sofort beim Aufwachen)','+0.5 XP'],['gruentee','🍵 Grüntee + Zitrone + Ingwer (nüchtern — nichts dazu)','+0.5 XP'],['supps','💊 Supplements: D3+K2+MCT · Carotin · Ginkgo · Ginseng · OPC','+0.5 XP'],['kaffee','☕ Kaffee + Kollagen 10-15g + Hafermilch (mit erstem Essen)','+0.5 XP']].map(([k,l,x]) => (
                <div key={k} onClick={async ()=>{const n={...ritual,[k]:!ritual[k]};setRitual(n);await saveData(`ritual_${dkey}`,n);}}
                  style={{ display:'flex', alignItems:'flex-start', padding:'9px 0', borderBottom:'1px solid #111C2A', cursor:'pointer' }}>
                  <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, marginRight:9, marginTop:1, border:`1.5px solid ${ritual[k]?P.green:'#2A3A5A'}`, background:ritual[k]?P.green+'22':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {ritual[k] && <span style={{ color:P.green, fontSize:12 }}>✓</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:ritual[k]?P.white:P.muted }}>{l}</div>
                    <div style={{ fontSize:9, color:P.gold }}>{x}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:10, padding:9, background:P.raised, borderRadius:8 }}>
                <div style={{ fontSize:9, color:P.muted, marginBottom:4, fontWeight:700 }}>LAB-HINWEISE TANJA</div>
                {[['🔴 VD: 40.7 nmol/L — D3 täglich lebenswichtig!',P.red],['⚠️ HB: 12.3 — Kaffee 30 Min NACH Mahlzeit für Eisenaufnahme',P.orange],['⚠️ Glucose: 108 — No-Carb nach 16h konsequent halten',P.orange],['⚠️ B12: 289 pmol/L — weiter supplementieren',P.muted]].map(([t,c])=>(
                  <div key={t} style={{ fontSize:10, color:c, marginBottom:2 }}>{t}</div>
                ))}
              </div>
            </div>
          )}

          {/* ESSEN — Combined meal tracking + KI analysis */}
          {hs === 'essen' && <>
            {/* Cheat Day toggle */}
            <div onClick={async () => { const n=!cheatDay; setCheatDay(n); await saveData(`cheatday_${dkey}`,n); }}
              style={{ background:P.card, borderRadius:10, padding:'12px 14px', marginBottom:10, border:`1px solid ${cheatDay?P.gold:P.border}`, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>🎉 Cheat Day</div>
                <div style={{ fontSize:10, color:P.muted }}>1× pro Woche · alles erlaubt</div>
              </div>
              <div style={{ width:44, height:24, borderRadius:12, background:cheatDay?P.gold:'#243361', position:'relative', transition:'background 0.2s' }}>
                <div style={{ width:20, height:20, borderRadius:10, background:'#fff', position:'absolute', top:2, left:cheatDay?22:2, transition:'left 0.2s' }}/>
              </div>
            </div>

            {/* 4 Meal slots */}
            <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${P.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ fontSize:9, fontWeight:700, color:P.gold, letterSpacing:2 }}>MAHLZEITEN</div>
                <div style={{ fontSize:11, color:mealsChecked===4?P.green:P.muted, fontWeight:700 }}>✓ {mealsChecked}/4</div>
              </div>
              {MEAL_SLOTS.map(slot => (
                <div key={slot.id} onClick={() => toggleMeal(slot.id)}
                  style={{ display:'flex', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #111C2A', cursor:'pointer' }}>
                  <div style={{ fontSize:26, marginRight:12 }}>{slot.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:meals[slot.id]?P.white:P.muted }}>{slot.label}</div>
                    <div style={{ fontSize:10, color:P.muted }}>{slot.sublabel}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:9, padding:'3px 8px', borderRadius:10, background:P.raised, color:P.muted }}>{slot.time}</span>
                    <div style={{ width:22, height:22, borderRadius:11, border:`2px solid ${meals[slot.id]?P.green:'#2A3A5A'}`, background:meals[slot.id]?P.green:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {meals[slot.id] && <span style={{ color:'#fff', fontSize:13 }}>✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No-Gos */}
            <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${P.border}` }}>
              <div style={{ fontSize:9, fontWeight:700, color:P.muted, letterSpacing:2, marginBottom:8 }}>NO-GOS TÄGLICH</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {NO_GOS.map(ng => (
                  <span key={ng} style={{ padding:'4px 10px', borderRadius:20, background:'#2A1010', border:'1px solid #FC818155', fontSize:11, color:P.red }}>
                    ❌ {ng}
                  </span>
                ))}
              </div>
            </div>

            {/* KI Food tracking */}
            <div style={{ display:'flex', gap:6, marginBottom:10 }}>
              {['heute','verlauf'].map(v => (
                <button key={v} onClick={()=>setFoodView(v)} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:11, background:foodView===v?P.gold+'33':P.raised, color:foodView===v?P.gold:P.muted, border:foodView===v?`1px solid ${P.gold}`:`1px solid ${P.border}` }}>
                  {v === 'heute' ? '🍽️ Heute' : '📊 Verlauf'}
                </button>
              ))}
            </div>

            {foodView === 'heute' && <>
              {/* Tagesbilanz */}
              {food.length > 0 && (
                <div style={{ background:P.card, borderRadius:10, padding:10, marginBottom:10, border:`1px solid ${P.gold}33` }}>
                  <div style={{ fontSize:9, fontWeight:700, color:P.gold, marginBottom:6 }}>TAGESBILANZ</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5 }}>
                    {[['🔥',`${Math.round(foodTot.cal)}kcal`,'Kalorien'],['🥩',`${Math.round(foodTot.prot)}g`,'Protein'],['🍞',`${Math.round(foodTot.carbs)}g`,'Carbs'],['🍊',`${Math.round(foodTot.vitC)}mg`,'Vit C'],['🩸',`${Math.round(foodTot.iron)}mg`,'Eisen'],['💊',`${Math.round(foodTot.mag)}mg`,'Magnesium']].map(([e,v,l])=>(
                      <div key={l} style={{ background:P.raised, borderRadius:8, padding:'7px 4px', textAlign:'center' }}>
                        <div style={{ fontSize:14 }}>{e}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:P.goldFg }}>{v}</div>
                        <div style={{ fontSize:8, color:P.muted }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {foodTot.vitC < 30 && <div style={{ fontSize:9.5, color:P.orange, marginTop:6 }}>⚠️ Wenig Vit C — Eisenaufnahme suboptimal</div>}
                  {foodTot.iron < 5 && <div style={{ fontSize:9.5, color:P.orange, marginTop:3 }}>⚠️ Wenig Eisen — Kürbiskerne, Lachs einplanen</div>}
                </div>
              )}

              {/* Add food */}
              <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${P.border}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:P.gold, marginBottom:8 }}>🤖 KI MAHLZEIT-ANALYSE</div>
                <div style={{ fontSize:9.5, color:P.muted, marginBottom:8 }}>Beschreibe was du gegessen hast oder mach ein Foto — KI analysiert Nährwerte automatisch.</div>
                <input value={foodIn} onChange={e=>setFoodIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addFoodText()} placeholder="z.B. Porridge mit Beeren, Orangensaft 200ml…" style={{ ...inp, marginBottom:8 }}/>
                <div style={{ display:'flex', gap:7 }}>
                  <button onClick={addFoodText} disabled={analyzing||!foodIn.trim()} style={{ flex:1, padding:'10px', background:analyzing?P.muted+'22':P.gold+'22', border:`1px solid ${P.gold}55`, borderRadius:8, color:analyzing?P.muted:P.gold, fontWeight:700, cursor:'pointer', fontSize:11 }}>
                    {analyzing ? '⏳ Analysiere…' : '📝 Text analysieren'}
                  </button>
                  <button onClick={()=>fileRef.current?.click()} disabled={analyzing} style={{ flex:1, padding:'10px', background:P.blue+'22', border:`1px solid ${P.blue}55`, borderRadius:8, color:P.blue, fontWeight:700, cursor:'pointer', fontSize:11 }}>📸 Foto</button>
                </div>
                {analyzing && <div className="pulse" style={{ textAlign:'center', color:P.muted, fontSize:11, marginTop:8 }}>KI analysiert das Bild…</div>}
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }}/>
              </div>

              {/* Food timeline */}
              {food.length > 0 ? (
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:16, top:0, bottom:0, width:2, background:`linear-gradient(${P.gold}44,${P.gold}11)` }}/>
                  {food.map(f => (
                    <div key={f.id} className="slide-in" style={{ display:'flex', gap:12, marginBottom:10, paddingLeft:30, position:'relative' }}>
                      <div style={{ position:'absolute', left:10, top:8, width:14, height:14, borderRadius:7, background:P.gold, border:`2px solid ${P.bg}` }}/>
                      <div style={{ flex:1, background:P.card, borderRadius:10, padding:10, border:`1px solid ${P.border}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, alignItems:'flex-start' }}>
                          <span style={{ fontSize:12, fontWeight:700 }}>{f.photo?'📸 ':''}{f.ai?.name||f.desc}</span>
                          <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                            <span style={{ fontSize:10, color:P.muted }}>{f.time}</span>
                            <button onClick={()=>deleteFood(f.id)} style={{ background:'transparent', border:'none', color:P.muted, cursor:'pointer', fontSize:14, padding:'0 2px', lineHeight:1 }}>🗑</button>
                          </div>
                        </div>
                        {f.ai && <>
                          <div style={{ fontSize:9, color:P.muted, marginBottom:6 }}>{f.ai.portion}</div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:3, marginBottom:5 }}>
                            {[['🔥',`${f.ai.calories||0}kcal`],['🥩',`${f.ai.protein_g||0}g`],['🍞',`${f.ai.carbs_g||0}g`],['🍊',`${f.ai.vitamin_c_mg||0}mg`]].map(([e,v])=>(
                              <div key={v} style={{ background:P.raised, borderRadius:5, padding:'3px', textAlign:'center', fontSize:8 }}>{e} <span style={{ color:P.goldFg, fontWeight:700 }}>{v}</span></div>
                            ))}
                          </div>
                          {f.ai.notes && <div style={{ fontSize:9, color:P.muted }}>ℹ️ {f.ai.notes}</div>}
                          {f.ai.mangel && <div style={{ fontSize:9.5, color:P.red, fontWeight:700 }}>⚠️ {f.ai.mangel}</div>}
                        </>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:'center', color:P.muted, fontSize:12, padding:24, background:P.card, borderRadius:10, border:`1px solid ${P.border}` }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🍽️</div>
                  Noch nichts eingetragen — füge deine erste Mahlzeit hinzu!
                </div>
              )}
            </>}

            {foodView === 'verlauf' && (
              <div>
                <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${P.border}` }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                    {[['🔥',String(streak),'Streak'],['✅',`${mealsChecked}/4`,'Heute'],['💧',`T:${waterGlasses.T} O:${waterGlasses.O}`,'Gläser']].map(([e,v,l])=>(
                      <div key={l} style={{ background:P.raised, borderRadius:10, padding:'12px 8px', textAlign:'center' }}>
                        <div style={{ fontSize:20 }}>{e}</div>
                        <div style={{ fontSize:16, fontWeight:700, color:P.gold }}>{v}</div>
                        <div style={{ fontSize:9, color:P.muted }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:9, color:P.muted, fontWeight:700, marginBottom:8 }}>HEUTE</div>
                  <div style={{ background:P.raised, borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:12, fontWeight:700, marginBottom:3 }}>
                      {now.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'long'})}
                      <span style={{ marginLeft:8, padding:'2px 8px', borderRadius:10, background:P.gold+'33', fontSize:9, color:P.gold }}>Heute</span>
                    </div>
                    <div style={{ fontSize:10, color:P.muted }}>{mealsChecked} Mahlzeiten · {food.length} KI-Analysen · {Math.round(foodTot.cal)} kcal · {drinks.length} Getränke</div>
                    {freeNote && <div style={{ fontSize:10, color:P.muted, marginTop:4, fontStyle:'italic' }}>📝 "{freeNote.slice(0,60)}{freeNote.length>60?'…':''}"</div>}
                  </div>
                </div>

                {/* Day comparison using sleep history */}
                {sleepHistory.length > 0 && (
                  <div style={{ background:P.card, borderRadius:10, padding:12, border:`1px solid ${P.border}` }}>
                    <div style={{ fontSize:9, color:P.muted, fontWeight:700, marginBottom:10 }}>TAGE-VERGLEICH (letzte {sleepHistory.length} Tage)</div>
                    {sleepHistory.map((h,i) => {
                      const slpT = h.T || {}; const slpO = h.O || {};
                      const calcMins = (s) => { if(!s.bed||!s.wake) return 0; const [bh,bm]=s.bed.split(':').map(Number),[wh,wm]=s.wake.split(':').map(Number); let m=(wh*60+wm)-(bh*60+bm); if(m<0)m+=1440; return m; };
                      const minsT = calcMins(slpT), minsO = calcMins(slpO);
                      return (
                        <div key={i} style={{ marginBottom:10, padding:'8px 10px', background:P.raised, borderRadius:8 }}>
                          <div style={{ fontSize:11, fontWeight:700, marginBottom:6 }}>{h.date.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'})}</div>
                          <div style={{ display:'flex', gap:12 }}>
                            {minsT > 0 && (
                              <div>
                                <div style={{ fontSize:9, color:P.tanja, marginBottom:2 }}>TANJA</div>
                                <div style={{ fontSize:11, fontWeight:700, color:minsT>=420?P.green:P.orange }}>{Math.floor(minsT/60)}h {minsT%60>0?`${minsT%60}m`:''}</div>
                                <div style={{ fontSize:9, color:P.muted }}>{'⭐'.repeat(slpT.q||0)}</div>
                              </div>
                            )}
                            {minsO > 0 && (
                              <div>
                                <div style={{ fontSize:9, color:P.oli, marginBottom:2 }}>OLI</div>
                                <div style={{ fontSize:11, fontWeight:700, color:minsO>=420?P.green:P.orange }}>{Math.floor(minsO/60)}h {minsO%60>0?`${minsO%60}m`:''}</div>
                                <div style={{ fontSize:9, color:P.muted }}>{'⭐'.repeat(slpO.q||0)}</div>
                              </div>
                            )}
                            {slpT.notes && <div style={{ fontSize:9, color:P.muted, flex:1, fontStyle:'italic' }}>"{slpT.notes.slice(0,40)}"</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Rezept-Ideen */}
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:9, color:P.muted, fontWeight:700, letterSpacing:2, marginBottom:8 }}>REZEPT-IDEEN</div>
              {REZEPT_IDEEN.map(r => (
                <div key={r.name} style={{ background:P.card, borderRadius:10, padding:'12px 14px', marginBottom:6, border:`1px solid ${P.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:22 }}>{r.emoji}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600 }}>{r.name}</div>
                      <div style={{ fontSize:10, color:P.muted }}>{r.desc}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:16, color:P.muted }}>→</span>
                </div>
              ))}
            </div>
          </>}

          {/* TRINKEN — Water counter + drink log */}
          {hs === 'trinken' && <>
            {[['T','TANJA',P.tanja,waterGlasses.T,WATER_T],['O','OLI',P.oli,waterGlasses.O,WATER_O]].map(([w,nm,col,glasses,goal])=>{
              const ml = glasses * WATER_GLASS;
              const goalGlasses = Math.round(goal / WATER_GLASS);
              return (
                <div key={w} style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${col}33` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:col }}>{nm}</span>
                    <span style={{ fontSize:12, color:ml>=goal?P.green:P.muted, fontWeight:700 }}>{(ml/1000).toFixed(1)}L / {(goal/1000).toFixed(1)}L</span>
                  </div>
                  <div style={{ height:8, background:P.raised, borderRadius:4, overflow:'hidden', marginBottom:10 }}>
                    <div style={{ height:'100%', width:`${Math.min((ml/goal)*100,100)}%`, background:`linear-gradient(90deg,${col}88,${col})`, borderRadius:4, transition:'width 0.4s' }}/>
                  </div>
                  {/* Counter */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:8 }}>
                    <button onClick={()=>changeWater(w,-1)} style={{ width:40, height:40, borderRadius:20, border:`2px solid ${P.border}`, background:P.raised, color:P.muted, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:32, fontWeight:700, color:col }}>{glasses}</div>
                      <div style={{ fontSize:9, color:P.muted }}>Gläser (à 250ml) · Ziel: {goalGlasses}</div>
                    </div>
                    <button onClick={()=>changeWater(w,1)} style={{ width:40, height:40, borderRadius:20, border:'none', background:col, color:'#000', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, justifyContent:'center' }}>
                    {Array.from({length:goalGlasses}).map((_,i)=>(
                      <span key={i} style={{ fontSize:18, opacity:glasses>i?1:0.2 }}>💧</span>
                    ))}
                  </div>
                  {ml >= goal && <div style={{ fontSize:11, color:P.green, fontWeight:700, textAlign:'center', marginTop:8 }}>🎉 Wasserziel erreicht! +3 XP</div>}
                </div>
              );
            })}

            {/* Drink logger */}
            <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${P.border}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:P.gold, marginBottom:8 }}>+ GETRÄNK EINTRAGEN</div>
              <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                {['T','O'].map(p=>(
                  <button key={p} onClick={()=>setDrinkForm(f=>({...f,p}))} style={{ flex:1, padding:'8px', borderRadius:7, border:`1px solid ${drinkForm.p===p?(p==='T'?P.tanja:P.oli):P.border}`, cursor:'pointer', fontWeight:700, fontSize:12, background:drinkForm.p===p?(p==='T'?P.tanja:P.oli)+'33':P.raised, color:drinkForm.p===p?(p==='T'?P.tanja:P.oli):P.muted }}>
                    {p==='T'?'Tanja':'Oli'}
                  </button>
                ))}
              </div>
              <select value={drinkForm.k} onChange={e=>setDrinkForm(f=>({...f,k:e.target.value}))} style={{ width:'100%', background:P.raised, border:`1px solid ${P.border}`, borderRadius:8, padding:9, color:P.white, fontSize:12, outline:'none', marginBottom:8 }}>
                <optgroup label="💧 Wasser & Positiv">{DRINKS_DEF.filter(d=>d.cat==='gut').map(d=><option key={d.k} value={d.k}>{d.e} {d.l} (+{d.xp}XP)</option>)}</optgroup>
                <optgroup label="☕ Kaffee">{DRINKS_DEF.filter(d=>d.cat==='ok').map(d=><option key={d.k} value={d.k}>{d.e} {d.l} ({d.xp>=0?'+':''}{d.xp}XP)</option>)}</optgroup>
                <optgroup label="⚠️ Nicht optimal">{DRINKS_DEF.filter(d=>d.cat==='schlecht').map(d=><option key={d.k} value={d.k}>{d.e} {d.l} ({d.xp}XP)</option>)}</optgroup>
                <optgroup label="🍷 Alkohol">{DRINKS_DEF.filter(d=>d.cat==='alkohol').map(d=><option key={d.k} value={d.k}>{d.e} {d.l} ({d.xp}XP)</option>)}</optgroup>
              </select>
              {DRINKS_DEF.find(d=>d.k===drinkForm.k)?.note && <div style={{ fontSize:9.5, color:P.orange, marginBottom:8 }}>ℹ️ {DRINKS_DEF.find(d=>d.k===drinkForm.k).note}</div>}
              {isAlc(drinkForm.k) && drinkForm.p==='O' && <div style={{ fontSize:9.5, color:P.red, fontWeight:700, marginBottom:8 }}>⚠️ Tafil/Bupropion + Alkohol — sehr vorsichtig!</div>}
              {isAlc(drinkForm.k) && cycle.noAlc && <div style={{ fontSize:9.5, color:P.red, fontWeight:700, marginBottom:8 }}>🚫 Kein Alkohol Tag — doppelter Malus!</div>}
              <button onClick={addDrink} style={{ width:'100%', padding:'10px', background:P.gold+'22', border:`1px solid ${P.gold}55`, borderRadius:8, color:P.gold, fontWeight:700, cursor:'pointer', fontSize:12 }}>Eintragen</button>
            </div>
            {drinks.length > 0 && (
              <div style={{ background:P.card, borderRadius:10, padding:12, border:`1px solid ${P.border}` }}>
                <div style={{ fontWeight:700, fontSize:11, color:P.gold, marginBottom:8 }}>HEUTE — LOG</div>
                {drinks.map(d => (
                  <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #0F1829' }}>
                    <span style={{ fontSize:12 }}>{d.emoji} {d.label}</span>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:10, color:d.xp>=0?P.gold:P.red, fontWeight:700 }}>{d.p==='T'?'T':'O'} {d.xp>=0?'+':''}{d.xp}XP</span>
                      <button onClick={()=>deleteDrink(d.id)} style={{ background:'transparent', border:'none', color:P.muted, cursor:'pointer', fontSize:13 }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>}

          {/* SCHLAF */}
          {hs === 'schlaf' && <>
            {/* Night label - makes clear which night is meant */}
            {(() => {
              const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
              const yesterdayStr = yesterday.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
              const todayStr = now.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
              return (
                <div style={{ background:P.raised, borderRadius:10, padding:'10px 14px', marginBottom:12, border:`1px solid ${P.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:9, color:P.muted, marginBottom:2 }}>AKTUELLE SCHLAF-NACHT</div>
                    <div style={{ fontSize:12, fontWeight:700 }}>🌙 {yesterdayStr} → ☀️ {todayStr}</div>
                  </div>
                  <div style={{ fontSize:22 }}>🌙</div>
                </div>
              );
            })()}
            {[['T','TANJA',P.tanja],['O','OLI',P.oli]].map(([w,nm,col])=>(
              <div key={w} style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${col}33` }}>
                <div style={{ fontWeight:700, fontSize:14, color:col, marginBottom:10 }}>{nm} — Schlaf</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:10, color:P.muted, marginBottom:4 }}>🌙 Eingeschlafen (gestern)</div>
                    <input type="time" value={slp[w].bed} onChange={async e=>{const n={...slp,[w]:{...slp[w],bed:e.target.value}};setSlp(n);await saveData(`slp_${dkey}`,n);}}
                      style={{ width:'100%', background:P.raised, border:`1px solid ${P.border}`, borderRadius:8, padding:'10px 8px', color:P.white, fontSize:14, outline:'none' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:P.muted, marginBottom:4 }}>☀️ Aufgewacht (heute)</div>
                    <input type="time" value={slp[w].wake} onChange={async e=>{const n={...slp,[w]:{...slp[w],wake:e.target.value}};setSlp(n);await saveData(`slp_${dkey}`,n);}}
                      style={{ width:'100%', background:P.raised, border:`1px solid ${P.border}`, borderRadius:8, padding:'10px 8px', color:P.white, fontSize:14, outline:'none' }}/>
                  </div>
                </div>
                {slp[w].bed && slp[w].wake && (() => {
                  const [bh,bm]=slp[w].bed.split(':').map(Number),[wh,wm]=slp[w].wake.split(':').map(Number);
                  let mins=(wh*60+wm)-(bh*60+bm); if(mins<0) mins+=1440;
                  const hrs = Math.floor(mins/60), rmin = mins%60;
                  const color = hrs>=7?P.green:hrs>=6?P.orange:P.red;
                  return (
                    <div style={{ background:color+'22', border:`1px solid ${color}55`, borderRadius:8, padding:'8px 12px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:13, color, fontWeight:700 }}>⏱ {hrs}h {rmin}min Schlaf</span>
                      <span style={{ fontSize:10, color:P.muted }}>{hrs>=7?'Gut geschlafen ✓':hrs>=6?'Fast ausreichend':'Zu wenig!'}</span>
                    </div>
                  );
                })()}
                {w==='O' && <div style={{ fontSize:10, color:P.blue, marginBottom:10 }}>🌙 Amitriptylin 25mg unterstützt deinen Schlaf — nimm es um 18-20h</div>}
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, color:P.muted, marginBottom:6 }}>Qualität ⭐</div>
                  <div style={{ display:'flex', gap:5 }}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={async()=>{const nn={...slp,[w]:{...slp[w],q:n}};setSlp(nn);await saveData(`slp_${dkey}`,nn);}} style={{ flex:1, padding:'10px', borderRadius:8, border:`1px solid ${slp[w].q>=n?col:P.border}`, cursor:'pointer', fontSize:16, background:slp[w].q>=n?col+'33':P.raised }}>
                        {n<=slp[w].q?'⭐':'☆'}
                      </button>
                    ))}
                  </div>
                </div>
                <input value={slp[w].notes} onChange={async e=>{const n={...slp,[w]:{...slp[w],notes:e.target.value}};setSlp(n);await saveData(`slp_${dkey}`,n);}} placeholder="Notizen: letztes Essen, Cannabis, Handy, Stress…" style={{ ...inp, fontSize:13 }}/>
              </div>
            ))}
            {/* Sleep history last 5 days */}
            {sleepHistory.length > 0 && (
              <div style={{ background:P.card, borderRadius:10, padding:12, border:`1px solid ${P.border}` }}>
                <div style={{ fontSize:10, color:P.muted, fontWeight:700, letterSpacing:1, marginBottom:10 }}>VERLAUF — LETZTE TAGE</div>
                {sleepHistory.slice(0,5).map((h,i) => {
                  const slpT = h.T || {}; const slpO = h.O || {};
                  const calcH = (s) => { if(!s.bed||!s.wake) return null; const [bh,bm]=s.bed.split(':').map(Number),[wh,wm]=s.wake.split(':').map(Number); let m=(wh*60+wm)-(bh*60+bm); if(m<0)m+=1440; return m; };
                  const minsT = calcH(slpT), minsO = calcH(slpO);
                  return (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #111C2A' }}>
                      <div style={{ fontSize:11, color:P.muted }}>{h.date.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'})}</div>
                      <div style={{ display:'flex', gap:12 }}>
                        {minsT && <span style={{ fontSize:10, color:P.tanja }}>T: {Math.floor(minsT/60)}h{minsT%60>0?` ${minsT%60}m`:''} {'⭐'.repeat(slpT.q||0)}</span>}
                        {minsO && <span style={{ fontSize:10, color:P.oli }}>O: {Math.floor(minsO/60)}h{minsO%60>0?` ${minsO%60}m`:''} {'⭐'.repeat(slpO.q||0)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>}

          {/* MIND */}
          {hs === 'mind' && <>
            <div style={{ display:'flex', gap:6, marginBottom:10 }}>
              {[['T','TANJA',P.tanja],['O','OLI',P.oli]].map(([w,nm,col])=>(
                <button key={w} onClick={()=>setMindTab(w)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${mindTab===w?col:P.border}`, cursor:'pointer', fontWeight:700, fontSize:12, background:mindTab===w?col+'33':P.raised, color:mindTab===w?col:P.muted }}>{nm}</button>
              ))}
            </div>
            <div style={{ background:P.card, borderRadius:10, padding:12, border:`1px solid ${(mindTab==='T'?P.tanja:P.oli)}33` }}>
              <div style={{ fontWeight:700, fontSize:13, color:mindTab==='T'?P.tanja:P.oli, marginBottom:10 }}>{mindTab==='T'?'TANJA':'OLI'} — State of Mind</div>
              {MIND_CATS.map(cat=>(
                <div key={cat.k} style={{ marginBottom:11 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:11 }}>{cat.e} {cat.l}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:mindTab==='T'?P.tanja:P.oli }}>{mind[cat.k]}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={mind[cat.k]} onChange={async e=>{
                    const n=Number(e.target.value);
                    if(mindTab==='T'){const nm={...mindT,[cat.k]:n};setMindT(nm);await saveData(`mind_t_${dkey}`,nm);}
                    else{const nm={...mindO,[cat.k]:n};setMindO(nm);await saveData(`mind_o_${dkey}`,nm);}
                  }} style={{ width:'100%', accentColor:mindTab==='T'?P.tanja:P.oli, cursor:'pointer' }}/>
                </div>
              ))}
              <div style={{ background:P.raised, borderRadius:8, padding:9, textAlign:'center' }}>
                <div style={{ fontSize:9, color:P.muted }}>GESAMT-SCORE</div>
                <div style={{ fontSize:24, fontWeight:700, color:mindTab==='T'?P.tanja:P.oli }}>{mindScore}/10</div>
              </div>
            </div>
          </>}

          {/* SUPPLEMENTS */}
          {hs === 'supp' && <>
            <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${P.tanja}33` }}>
              <div style={{ fontWeight:700, fontSize:13, color:P.tanja, marginBottom:8 }}>TANJA — Supplements</div>
              {['morgens','mit Kaffee','tagsüber','abends'].map(w=>(
                <div key={w} style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, color:P.muted, fontWeight:700, letterSpacing:1, marginBottom:3 }}>{w.toUpperCase()}</div>
                  {SUPP_T.filter(s=>s.w===w).map(s=>(
                    <div key={s.id} onClick={async()=>{const n={...suppT,[s.id]:!suppT[s.id]};setSuppT(n);await saveData(`supp_t_${dkey}`,n);}}
                      style={{ display:'flex', alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid #111C2A', cursor:'pointer' }}>
                      <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginRight:8, border:`1.5px solid ${suppT[s.id]?P.tanja:'#2A3A5A'}`, background:suppT[s.id]?P.tanja+'22':'transparent', display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 }}>
                        {suppT[s.id] && <span style={{ color:P.tanja, fontSize:11 }}>✓</span>}
                      </div>
                      <div><div style={{ fontSize:11, color:suppT[s.id]?P.white:P.muted }}>{s.l}</div>{s.lab&&<div style={{ fontSize:8.5, color:P.orange }}>{s.lab}</div>}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ background:P.card, borderRadius:10, padding:12, border:`1px solid ${P.oli}33` }}>
              <div style={{ fontWeight:700, fontSize:13, color:P.oli, marginBottom:4 }}>OLI — Medikamente</div>
              {!past11 && <div style={{ fontSize:10, color:P.orange, marginBottom:8, fontWeight:700 }}>⏰ Noch {Math.floor(minsTo11/60)}h {minsTo11%60}min bis 11:00 Uhr</div>}
              {past11 && !medO['bupro'] && <div style={{ background:P.red+'22', border:`1px solid ${P.red}`, borderRadius:7, padding:7, marginBottom:8, fontSize:10, color:P.red }}>⚠️ Bupropion noch nicht eingenommen!</div>}
              {past11 && !medO['tafil_m'] && <div style={{ background:P.red+'22', border:`1px solid ${P.red}`, borderRadius:7, padding:7, marginBottom:8, fontSize:10, color:P.red }}>⚠️ Tafil noch nicht eingenommen!</div>}
              {MEDS_O.map(m=>(
                <div key={m.id} onClick={async()=>{const n={...medO,[m.id]:!medO[m.id]};setMedO(n);await saveData(`med_o_${dkey}`,n);if(!medO[m.id])showFlash('💊 Eingenommen ✓');}}
                  style={{ display:'flex', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #111C2A', cursor:'pointer' }}>
                  <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginRight:8, border:`1.5px solid ${medO[m.id]?P.oli:'#2A3A5A'}`, background:medO[m.id]?P.oli+'22':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {medO[m.id] && <span style={{ color:P.oli, fontSize:11 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:11, color:medO[m.id]?P.white:P.muted }}>{m.emoji} {m.l} — {m.w}</span>
                </div>
              ))}
              <div style={{ marginTop:10, background:P.raised, borderRadius:8, padding:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div><div style={{ fontSize:11, fontWeight:700, color:P.oli }}>💊 Tafil PRN (nach Bedarf)</div><div style={{ fontSize:9, color:P.muted }}>0,5mg · zusätzliche Dosen</div></div>
                  <div style={{ fontSize:24, fontWeight:700, color:tafilPrn>0?P.orange:P.muted }}>{tafilPrn}x</div>
                </div>
                <button onClick={async()=>{const n=tafilPrn+1;setTafilPrn(n);await saveData(`tafil_prn_${dkey}`,n);showFlash('💊 Tafil PRN notiert');}} style={{ width:'100%', padding:'8px', background:P.oli+'22', border:`1px solid ${P.oli}55`, borderRadius:7, color:P.oli, fontWeight:700, cursor:'pointer', fontSize:11 }}>+ Tafil PRN eingenommen</button>
                {tafilPrn>=2 && <div style={{ fontSize:9.5, color:P.orange, marginTop:5 }}>⚠️ {tafilPrn}x PRN heute — beim Arzt besprechen</div>}
                {tafilPrn>0 && alcToday && <div style={{ fontSize:9.5, color:P.red, fontWeight:700, marginTop:5 }}>🔴 KRITISCH: Tafil + Alkohol!</div>}
              </div>
              <button onClick={()=>setAddingMed(!addingMed)} style={{ width:'100%', marginTop:8, padding:'7px', background:'transparent', border:`1px dashed ${P.border}`, borderRadius:7, color:P.muted, cursor:'pointer', fontSize:10 }}>+ Weiteres Medikament hinzufügen</button>
              {addingMed && <div style={{ marginTop:8 }}>
                <input value={newMedTxt} onChange={e=>setNewMedTxt(e.target.value)} placeholder="Name des Medikaments…" style={{ ...inp, marginBottom:6 }}/>
                <div style={{ display:'flex', gap:4, marginBottom:6 }}>
                  {['morgens','mittags','abends','n. Bedarf'].map(w=>(
                    <button key={w} onClick={()=>setNewMedW(w)} style={{ flex:1, padding:'5px 2px', borderRadius:5, border:'none', cursor:'pointer', fontSize:8, background:newMedW===w?P.oli+'33':P.bg, color:newMedW===w?P.oli:P.muted, border:newMedW===w?`1px solid ${P.oli}`:`1px solid ${P.border}` }}>{w}</button>
                  ))}
                </div>
                <button onClick={async()=>{if(!newMedTxt.trim())return;const m={id:`m${Date.now()}`,l:newMedTxt.trim(),w:newMedW};const u=[...suppOExtra,m];setSuppOExtra(u);setNewMedTxt('');setAddingMed(false);await saveData('supp_o_extra',u);}} style={{ width:'100%', padding:'7px', background:P.oli, border:'none', borderRadius:7, color:'#fff', fontWeight:700, cursor:'pointer' }}>Hinzufügen</button>
              </div>}
              {suppOExtra.map(s=>(
                <div key={s.id} onClick={async()=>{const n={...medO,[s.id]:!medO[s.id]};setMedO(n);await saveData(`med_o_${dkey}`,n);}}
                  style={{ display:'flex', alignItems:'center', padding:'8px 0', borderTop:'1px solid #111C2A', cursor:'pointer' }}>
                  <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginRight:8, border:`1.5px solid ${medO[s.id]?P.oli:'#2A3A5A'}`, background:medO[s.id]?P.oli+'22':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {medO[s.id] && <span style={{ color:P.oli, fontSize:11 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:11, color:medO[s.id]?P.white:P.muted }}>💊 {s.l} ({s.w})</span>
                </div>
              ))}
            </div>
          </>}

          {/* CANNABIS */}
          {hs === 'cannabis' && <>
            <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${P.green}33` }}>
              <div style={{ fontWeight:700, fontSize:12, color:P.green, marginBottom:10 }}>🌿 Session eintragen</div>
              {cf.p==='O'&&tafilPrn>0&&<div style={{ fontSize:9.5, color:P.orange, marginBottom:8 }}>🟡 Oli hat heute {tafilPrn}x Tafil PRN — Cannabis + Benzo verstärken sich</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:7 }}>
                <div>
                  <div style={{ fontSize:9, color:P.muted, marginBottom:3 }}>Person</div>
                  <div style={{ display:'flex', gap:4 }}>
                    {['T','O'].map(p=>(
                      <button key={p} onClick={()=>setCf(f=>({...f,p}))} style={{ flex:1, padding:'8px', borderRadius:7, border:`1px solid ${cf.p===p?(p==='T'?P.tanja:P.oli):P.border}`, cursor:'pointer', fontWeight:700, fontSize:11, background:cf.p===p?(p==='T'?P.tanja:P.oli)+'33':P.raised, color:cf.p===p?(p==='T'?P.tanja:P.oli):P.muted }}>{p==='T'?'Tanja':'Oli'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:9, color:P.muted, marginBottom:3 }}>Uhrzeit</div>
                  <input type="time" value={cf.time} onChange={e=>setCf(f=>({...f,time:e.target.value}))} style={{ width:'100%', background:P.raised, border:`1px solid ${P.border}`, borderRadius:7, padding:'8px', color:P.white, fontSize:12, outline:'none' }}/>
                </div>
              </div>
              <input value={cf.sorte} onChange={e=>setCf(f=>({...f,sorte:e.target.value}))} placeholder="Sorte (z.B. OG Kush, medizinische Sorte…)" style={{ ...inp, marginBottom:7 }}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:7 }}>
                <div><div style={{ fontSize:9, color:P.muted, marginBottom:3 }}>Typ</div>
                  <select value={cf.typ} onChange={e=>setCf(f=>({...f,typ:e.target.value}))} style={{ width:'100%', background:P.raised, border:`1px solid ${P.border}`, borderRadius:7, padding:'8px 4px', color:P.white, fontSize:11, outline:'none' }}>
                    {['Indica','Sativa','Hybrid'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><div style={{ fontSize:9, color:P.muted, marginBottom:3 }}>Menge</div><input value={cf.menge} onChange={e=>setCf(f=>({...f,menge:e.target.value}))} placeholder="0.1g" style={inp}/></div>
                <div><div style={{ fontSize:9, color:P.muted, marginBottom:3 }}>Form</div>
                  <select value={cf.form} onChange={e=>setCf(f=>({...f,form:e.target.value}))} style={{ width:'100%', background:P.raised, border:`1px solid ${P.border}`, borderRadius:7, padding:'8px 4px', color:P.white, fontSize:11, outline:'none' }}>
                    {['Vaporizer','Joint (Tabak)','Joint (Pure)','Bong'].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:9, color:P.muted }}>Wirkung / Gefühl</span>
                  <span style={{ fontSize:12, color:P.green, fontWeight:700 }}>{cf.feeling}/10</span>
                </div>
                <input type="range" min="1" max="10" value={cf.feeling} onChange={e=>setCf(f=>({...f,feeling:Number(e.target.value)}))} style={{ width:'100%', accentColor:P.green, cursor:'pointer' }}/>
              </div>
              <button onClick={async()=>{if(!cf.sorte||!cf.time)return;const e={...cf,id:`can${Date.now()}`};const u=[...cannabis,e];setCannabis(u);setCf({p:who,time:'',sorte:'',typ:'Indica',menge:'',form:'Vaporizer',feeling:5});await saveData(`can_${dkey}`,u);showFlash('+1 XP 🌿');}} style={{ width:'100%', padding:'10px', background:P.green+'22', border:`1px solid ${P.green}`, borderRadius:8, color:P.green, fontWeight:700, cursor:'pointer', fontSize:12 }}>Session speichern</button>
            </div>
            {cannabis.map(c=>(
              <div key={c.id} style={{ background:P.card, borderRadius:10, padding:10, marginBottom:8, border:`1px solid ${P.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3, alignItems:'center' }}>
                  <span style={{ fontWeight:700, color:c.p==='T'?P.tanja:P.oli }}>{c.p==='T'?'Tanja':'Oli'} · {c.time}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:c.typ==='Sativa'?'#1A3A1A':c.typ==='Indica'?'#1A1A3A':'#2A2A1A', color:c.typ==='Sativa'?P.green:c.typ==='Indica'?P.blue:P.gold }}>{c.typ}</span>
                    <button onClick={()=>deleteCannabis(c.id)} style={{ background:'transparent', border:'none', color:P.muted, cursor:'pointer', fontSize:13 }}>🗑</button>
                  </div>
                </div>
                <div style={{ fontSize:11 }}>{c.sorte} · {c.menge} · {c.form} · Wirkung: {c.feeling}/10</div>
              </div>
            ))}
          </>}

          {/* BODY */}
          {hs === 'body' && <>
            <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid #F6AD5533` }}>
              <div style={{ fontWeight:700, fontSize:12, color:P.orange, marginBottom:6 }}>☀️ SONNEN-TRACKER (Vit D: 40.7 nmol/L — kritisch!)</div>
              <div style={{ fontSize:9.5, color:P.muted, marginBottom:10 }}>20 Min Sonne = +1 XP · Optimale Zeit: 10-14h · Gesicht + Arme</div>
              {[['T','TANJA',P.tanja],['O','OLI',P.oli]].map(([w,nm,col])=>(
                <div key={w} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={async()=>{const n={...sonne,[w]:!sonne[w]};setSonne(n);await saveData(`sonne_${dkey}`,n);if(!sonne[w])showFlash('+1 XP ☀️');}} style={{ flex:1, padding:'10px', borderRadius:8, border:`1px solid ${sonne[w]?P.orange:P.border}`, cursor:'pointer', background:sonne[w]?P.orange+'33':P.raised, color:sonne[w]?P.orange:P.muted, fontWeight:700, fontSize:12 }}>
                      {nm}: {sonne[w]?'☀️ Sonne gehabt ✓':'☀️ Sonne today?'}
                    </button>
                    <select value={sonneDur[w]} onChange={e=>setSonneDur(s=>({...s,[w]:Number(e.target.value)}))} style={{ width:90, background:P.raised, border:`1px solid ${P.border}`, borderRadius:7, padding:'7px', color:P.white, fontSize:11, outline:'none' }}>
                      {[0,15,20,30,45,60].map(m=><option key={m} value={m}>{m===0?'Min?':`${m} Min`}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:P.card, borderRadius:10, padding:12, marginBottom:10, border:`1px solid ${P.red}33` }}>
              <div style={{ fontWeight:700, fontSize:12, color:P.red, marginBottom:4 }}>🦶 BÄNDERRISS — Heilungs-Tagebuch (Für Versicherung!)</div>
              <div style={{ fontSize:9.5, color:P.muted, marginBottom:10 }}>Täglich dokumentieren — Versicherung + Heilungsfortschritt!</div>
              {[['schmerz','🩹 Schmerz (1=stark, 10=kein)'],['schwellung','💧 Schwellung (1=stark, 10=keine)'],['mobilitaet','🦶 Mobilität (1=kaum, 10=voll)']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:10 }}>{l}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:ankle[k]>=7?P.green:ankle[k]>=4?P.orange:P.red }}>{ankle[k]}/10</span>
                  </div>
                  <input type="range" min="1" max="10" value={ankle[k]} onChange={async e=>{const n={...ankle,[k]:Number(e.target.value)};setAnkle(n);await saveData(`ankle_${dkey}`,n);}} style={{ width:'100%', accentColor:P.red, cursor:'pointer' }}/>
                </div>
              ))}
              <input value={ankle.notes} onChange={async e=>{const n={...ankle,notes:e.target.value};setAnkle(n);await saveData(`ankle_${dkey}`,n);}} placeholder="Notizen: Physio, Übungen, Veränderungen…" style={inp}/>
              <div style={{ fontSize:9.5, color:P.orange, marginTop:8 }}>💡 D3 + Kollagen + Omega-3 unterstützen die Bänder-Heilung direkt</div>
            </div>

            <div style={{ background:P.card, borderRadius:10, padding:12, border:`1px solid ${P.green}33` }}>
              <div style={{ fontWeight:700, fontSize:12, color:P.green, marginBottom:4 }}>🌿 ANTI-ENTZÜNDUNGS-TRACKER</div>
              <div style={{ fontSize:9.5, color:P.muted, marginBottom:10 }}>Für Bänderriss-Heilung + allgemeine Entzündungshemmung</div>
              {ANTI_INF.map(a=>(
                <div key={a.k} onClick={async()=>{const n={...antiInf,[a.k]:!antiInf[a.k]};setAntiInf(n);await saveData(`antiinf_${dkey}`,n);if(!antiInf[a.k])showFlash(`+${a.xp} XP 🌿`);}}
                  style={{ display:'flex', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #111C2A', cursor:'pointer' }}>
                  <div style={{ width:17, height:17, borderRadius:4, flexShrink:0, marginRight:9, border:`1.5px solid ${antiInf[a.k]?P.green:'#2A3A5A'}`, background:antiInf[a.k]?P.green+'22':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {antiInf[a.k] && <span style={{ color:P.green, fontSize:11 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:11, flex:1, color:antiInf[a.k]?P.white:P.muted }}>{a.e} {a.l}</span>
                  <span style={{ fontSize:9, color:P.gold }}>+{a.xp}XP</span>
                </div>
              ))}
            </div>
          </>}
        </>}

        {/* ══════════════════════════════════════════════════════ WOCHE */}
        {tab === 'woche' && (() => {
          const week = getCurrentWeek();
          const activeDay = selDay || dk;
          return <>
            {/* Week navigation with real dates */}
            <div style={{ display:'flex', gap:4, marginBottom:12, overflowX:'auto', paddingBottom:4 }}>
              {week.map(day => (
                <button key={day.key} onClick={()=>setSelDay(day.key)}
                  style={{ flexShrink:0, padding:'8px 10px', borderRadius:10, border:`1px solid ${day.isToday?P.goldDim:P.border}`, cursor:'pointer',
                    background:activeDay===day.key?P.gold:day.isPast?P.bg:P.card,
                    color:activeDay===day.key?'#000':day.isToday?P.goldFg:day.isPast?P.muted:P.white,
                    fontWeight:activeDay===day.key||day.isToday?700:400,
                    opacity:day.isPast?0.6:1,
                    minWidth:52, textAlign:'center' }}>
                  <div style={{ fontSize:10, fontWeight:700 }}>{day.key}</div>
                  <div style={{ fontSize:8, marginTop:1 }}>{day.dateStr}</div>
                  {day.isToday && <div style={{ fontSize:6, color:activeDay===day.key?'#000':P.gold, marginTop:1 }}>heute</div>}
                </button>
              ))}
            </div>
            {/* Selected day info */}
            {(() => {
              const selectedDay = week.find(d=>d.key===activeDay);
              return selectedDay && (
                <div style={{ fontSize:11, color:P.muted, marginBottom:8, textAlign:'center' }}>
                  {selectedDay.date.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                  {selectedDay.isPast && <span style={{ marginLeft:6, color:P.muted, fontSize:9 }}>vergangen</span>}
                  {selectedDay.isFuture && <span style={{ marginLeft:6, color:P.blue, fontSize:9 }}>geplant</span>}
                </div>
              );
            })()}
            <TaskList tasks={SCHED[activeDay]||[]} done={done} onToggle={toggle} readonly={activeDay!==dk}/>
          </>;
        })()}

        {/* ══════════════════════════════════════════════════════ CONTENT */}
        {tab === 'content' && (
          <div style={{ textAlign:'center', padding:40, color:P.muted }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📱</div>
            <div style={{ fontSize:14, fontWeight:700, color:P.gold, marginBottom:8 }}>Content Studio</div>
            <div style={{ fontSize:11, lineHeight:1.8 }}>
              Pipeline · Skript-Generator · Monaco Events<br/>
              Voice Profiles · FR → DE/EN Adapter<br/>
              <br/>
              <span style={{ color:P.orange }}>→ Eigene Seite: /content</span>
            </div>
            <button onClick={()=>window.location.href='/content'} style={{ marginTop:16, padding:'12px 24px', background:P.gold, border:'none', borderRadius:10, color:'#000', fontWeight:700, fontSize:13, cursor:'pointer' }}>Content Studio öffnen 🚀</button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ AVATAR */}
        {tab === 'avatar' && <>

          {/* Weekly Review — Sonntag */}
          {now.getDay() === 0 && (
            <div style={{ background:'linear-gradient(135deg,#1A2744,#0F1E3A)', borderRadius:12, padding:14, marginBottom:12, border:`1px solid ${P.gold}44` }}>
              <div style={{ fontSize:10, fontWeight:700, color:P.gold, letterSpacing:2, marginBottom:6 }}>🌟 WOCHEN-RÜCKBLICK — SONNTAG</div>
              {!weeklyReview && !weeklyLoading && (
                <button onClick={loadWeeklyReview} style={{ width:'100%', padding:'10px', background:P.gold+'22', border:`1px solid ${P.gold}55`, borderRadius:8, color:P.gold, fontWeight:700, cursor:'pointer', fontSize:12 }}>
                  🤖 KI-Rückblick generieren
                </button>
              )}
              {weeklyLoading && <div style={{ fontSize:12, color:P.muted, textAlign:'center', padding:10 }}>🤖 Analysiert eure Woche…</div>}
              {weeklyReview && <div style={{ fontSize:12, lineHeight:1.8, color:P.white }}>{weeklyReview}</div>}
            </div>
          )}

          {/* XP Breakdown popup */}
          {showXpBreakdown && (
            <div style={{ background:P.card, borderRadius:12, padding:14, marginBottom:12, border:`1px solid ${P.gold}44` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:P.gold }}>📊 XP HERKUNFT</div>
                <button onClick={()=>setShowXpBreakdown(false)} style={{ background:'transparent', border:'none', color:P.muted, cursor:'pointer', fontSize:16 }}>✕</button>
              </div>
              <div style={{ fontSize:10, color:P.muted, marginBottom:8 }}>Wie sammelt ihr XP?</div>
              {[
                ['Tasks abgehakt','Tagesplan-Items','1-3 XP pro Task'],
                ['Morgen-Ritual','4 Checks morgens','0.5 XP je Check'],
                ['Wasser getrunken','Wasserziel erreicht','+3 XP Bonus'],
                ['Getränke','Gute Getränke','+0.5 bis +1.5 XP'],
                ['Tages-Goals','No-Carb/Screen-free/Sonne','+1 XP je Goal'],
                ['Anti-Entzündung','Ingwer, Omega-3 etc.','+0.5 XP je Item'],
                ['Gassi','Hundespaziergänge','1-2 XP'],
                ['Content','Filming/Editing/Posting','2-3 XP'],
                ['Sonnentank','20 Min Sonne','+1 XP'],
              ].map(([cat,desc,xp])=>(
                <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #111C2A' }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600 }}>{cat}</div>
                    <div style={{ fontSize:9, color:P.muted }}>{desc}</div>
                  </div>
                  <span style={{ fontSize:10, color:P.gold, fontWeight:700 }}>{xp}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary — XP klickbar */}
          <div onClick={()=>setShowXpBreakdown(!showXpBreakdown)} style={{ background:P.card, borderRadius:10, padding:12, marginBottom:12, border:`1px solid ${P.gold}33`, display:'flex', justifyContent:'space-around', alignItems:'center', cursor:'pointer' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:26, fontWeight:700, color:P.gold }}>{streak}</div>
              <div style={{ fontSize:8, color:P.muted }}>STREAK 🔥</div>
              <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:4 }}>
                <button onClick={async()=>{const n=Math.max(0,streak-1);setStreak(n);await saveData('streak',n);}} style={bsm}>−</button>
                <button onClick={async()=>{const n=streak+1;setStreak(n);await saveData('streak',n);}} style={{ ...bsm, background:P.gold+'33', color:P.gold }}>+</button>
              </div>
            </div>
            <div style={{ width:1, height:60, background:P.border }}/>
            {[['TANJA','Die Architektin',xpT,lvlT,P.tanja,'T',avatarT],['OLI','Der Stratege',xpO,lvlO,P.oli,'O',avatarO]].map(([nm,tl,xp,lv,col,w,av])=>(
              <div key={nm} style={{ textAlign:'center' }}>
                <Avatar config={av} xp={xp} size={70} color={col}/>
                <div style={{ fontSize:13, fontWeight:700, color:col }}>{nm}</div>
                <div style={{ fontSize:8, color:P.muted }}>{tl}</div>
                <div style={{ fontSize:14, fontWeight:700, color:col }}>Lv.{lv+1}</div>
                <div style={{ fontSize:8, color:P.muted }}>{LEVELS[lv]} · {xp}XP</div>
                <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:4 }}>
                  <button onClick={()=>chgXp(w,-1)} style={bsm}>−</button>
                  <button onClick={()=>chgXp(w,1)} style={{ ...bsm, background:col+'33', color:col }}>+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Full avatar cards with customizer */}
          {[['TANJA','Die Architektin',xpT,lvlT,P.tanja,INIT_T,'T',avatarT],['OLI','Der Stratege',xpO,lvlO,P.oli,INIT_O,'O',avatarO]].map(([nm,tl,xp,lv,col,sk,w,av])=>(
            <div key={nm} style={{ background:P.card, borderRadius:12, padding:14, marginBottom:12, border:`1px solid ${col}44` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <Avatar config={av} xp={xp} size={80} color={col}/>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, color:col }}>{nm}</div>
                    <div style={{ fontSize:10, color:P.muted }}>{tl}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:col }}>Level {lv+1} — {LEVELS[lv]}</div>
                    <div style={{ fontSize:9, color:P.muted }}>{xp} XP · {xp%40}/40 zum nächsten Level</div>
                  </div>
                </div>
                <button onClick={()=>setShowAvatarCustomizer(showAvatarCustomizer===w?null:w)} style={{ padding:'6px 10px', borderRadius:8, border:`1px solid ${col}55`, background:col+'22', color:col, fontSize:10, fontWeight:700, cursor:'pointer' }}>
                  {showAvatarCustomizer===w ? 'Fertig ✓' : '✏️ Anpassen'}
                </button>
              </div>

              {/* XP bar */}
              <div style={{ marginBottom:10 }}>
                <div style={{ height:5, background:P.raised, borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(((xp%40)/40)*100,100)}%`, background:`linear-gradient(90deg,${col}88,${col})`, transition:'width 0.5s' }}/>
                </div>
              </div>

              {/* Avatar customizer */}
              {showAvatarCustomizer === w && (
                <div style={{ background:P.raised, borderRadius:10, padding:12, marginBottom:12 }}>
                  <AvatarCustomizer config={av} onChange={c=>saveAvatar(w,c)} color={col} label={nm}/>
                </div>
              )}

              {/* Skills */}
              {SKILLS.map(s=>(
                <div key={s.k} style={{ marginBottom:7 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:10 }}>{s.e} {s.l}</span>
                    <span style={{ fontSize:9, color:col, fontWeight:700 }}>Lv.{sk[s.k]}</span>
                  </div>
                  <div style={{ height:4, background:P.raised, borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(sk[s.k]/6)*100}%`, background:col+'88' }}/>
                  </div>
                </div>
              ))}

              {/* XP buttons */}
              <div style={{ display:'flex', gap:5, marginTop:10 }}>
                {[-1,+1,+2,+3].map(n=>(
                  <button key={n} onClick={()=>chgXp(w,n)} style={{ flex:1, padding:'7px 2px', borderRadius:7, border:`1px solid ${n>0?col+'55':P.border}`, cursor:'pointer', background:n>0?col+'22':P.raised, color:n>0?col:P.muted, fontSize:10, fontWeight:700 }}>{n>0?'+':''}{n}XP</button>
                ))}
              </div>
            </div>
          ))}
        </>}

      </div>
    </div>
  );
}
