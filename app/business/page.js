'use client';
import { useState, useEffect } from 'react';
import { askBusinessCoach } from '@/lib/ai-client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { saveData, loadAllData } from '@/lib/supabase';

const P = {
  bg:'#080F1E', card:'#1A2744', raised:'#243361',
  gold:'#C9A84C', goldDim:'#7A5F2A', goldFg:'#F0D88A',
  blue:'#4A90D9', white:'#F0F4FF', muted:'#7A8BA8',
  green:'#48BB78', red:'#FC8181', orange:'#F6AD55',
  tanja:'#C9A84C', oli:'#4A90D9', border:'#1E3055',
};

const inp = { background:'#243361', border:'1px solid #1E3055', borderRadius:8, padding:'9px 12px', color:'#F0F4FF', fontSize:12, outline:'none', width:'100%' };

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

const GOALS_T = [
  { k:'clients', l:'Aktive Kunden', emoji:'👥', target:10 },
  { k:'revenue', l:'Monatsumsatz (€)', emoji:'💰', target:5000 },
  { k:'content', l:'Posts diese Woche', emoji:'📱', target:5 },
  { k:'leads', l:'Neue Leads', emoji:'🎯', target:8 },
  { k:'consultations', l:'Beratungen', emoji:'📞', target:4 },
];

const GOALS_O = [
  { k:'clients', l:'Aktive Kunden', emoji:'👥', target:8 },
  { k:'revenue', l:'Monatsumsatz (€)', emoji:'💰', target:4000 },
  { k:'content', l:'Posts diese Woche', emoji:'📱', target:4 },
  { k:'leads', l:'Neue Leads', emoji:'🎯', target:6 },
  { k:'events', l:'Monaco Events besucht', emoji:'🎯', target:2 },
];

export default function BusinessTracker() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status]);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const [tab, setTab] = useState('tamosique');
  const [dataT, setDataT] = useState({});
  const [dataO, setDataO] = useState({});
  const [notes, setNotes] = useState({ T:'', O:'' });
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [flash, setFlash] = useState('');
  const [ready, setReady] = useState(false);
  const [historyT, setHistoryT] = useState([]);
  const [historyO, setHistoryO] = useState([]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const all = await loadAllData();
      setDataT(all[`biz_t_${monthKey}`] || {});
      setDataO(all[`biz_o_${monthKey}`] || {});
      setNotes({ T: all[`biz_notes_t_${monthKey}`] || '', O: all[`biz_notes_o_${monthKey}`] || '' });
      // Load last 3 months history
      const histT = [], histO = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date(now); d.setMonth(d.getMonth() - i);
        const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const dt = all[`biz_t_${mk}`];
        const do2 = all[`biz_o_${mk}`];
        if (dt) histT.push({ month: mk, monthLabel: MONTHS[d.getMonth()], data: dt });
        if (do2) histO.push({ month: mk, monthLabel: MONTHS[d.getMonth()], data: do2 });
      }
      setHistoryT(histT); setHistoryO(histO);
      setReady(true);
    })();
  }, [session]);

  const showFlash = msg => { setFlash(msg); setTimeout(() => setFlash(''), 1500); };

  async function updateGoal(who, key, value) {
    if (who === 'T') {
      const n = { ...dataT, [key]: value }; setDataT(n); await saveData(`biz_t_${monthKey}`, n);
    } else {
      const n = { ...dataO, [key]: value }; setDataO(n); await saveData(`biz_o_${monthKey}`, n);
    }
    showFlash('✓ Gespeichert');
  }

  async function saveNotes(who, val) {
    const n = { ...notes, [who]: val }; setNotes(n);
    await saveData(`biz_notes_${who.toLowerCase()}_${monthKey}`, val);
  }

  async function askKI() {
    if (!aiInput.trim()) return;
    setAiLoading(true); setAiResult('');
    try {
      const metrics = tab === 'tamosique' ? dataT : dataO;
      const result = await askBusinessCoach(label, tab === 'tamosique' ? 'Tanja' : 'Oli', metrics, aiInput);
      setAiResult(typeof result === 'string' ? result : JSON.stringify(result));
    } catch(e) { setAiResult('❌ ' + e.message); }
    setAiLoading(false);
  }

  if (!ready) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:P.bg, color:P.gold, fontSize:18, letterSpacing:3 }}>LADEN…</div>;

  const isT = tab === 'tamosique';
  const data = isT ? dataT : dataO;
  const goals = isT ? GOALS_T : GOALS_O;
  const col = isT ? P.tanja : P.oli;
  const label = isT ? 'tamosique' : 'M.O.C.';
  const history = isT ? historyT : historyO;

  const totalRevenue = Number(data.revenue || 0);
  const monthLabel = MONTHS[now.getMonth()] + ' ' + now.getFullYear();

  return (
    <div style={{ background:P.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', fontFamily:"'Segoe UI',sans-serif", color:'#F0F4FF' }}>
      {flash && <div style={{ position:'fixed', top:'42%', left:'50%', transform:'translate(-50%,-50%)', background:P.gold, color:'#000', fontWeight:700, fontSize:18, padding:'12px 24px', borderRadius:14, zIndex:999 }}>{flash}</div>}

      {/* Header */}
      <div style={{ background:'linear-gradient(160deg,#1A2744,#080F1E)', borderBottom:`1px solid ${P.goldDim}`, padding:'14px 16px 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:P.gold, fontSize:8, letterSpacing:4, fontWeight:700, marginBottom:3 }}>BUSINESS TRACKER</div>
            <div style={{ fontSize:12, color:P.muted }}>{monthLabel}</div>
          </div>
          <button onClick={()=>router.push('/dashboard')} style={{ background:'transparent', border:`1px solid ${P.border}`, borderRadius:8, padding:'6px 12px', color:P.muted, fontSize:11, cursor:'pointer' }}>← Dashboard</button>
        </div>
      </div>

      {/* Brand Tabs */}
      <div style={{ display:'flex', background:'#080F1E', borderBottom:`1px solid ${P.border}` }}>
        {[['tamosique','💼 tamosique'],['moc','🎯 M.O.C.']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:'12px 4px', background:'none', border:'none', cursor:'pointer', color:tab===k?col:P.muted, borderBottom:tab===k?`2px solid ${col}`:'2px solid transparent', fontSize:12, fontWeight:700 }}>{l}</button>
        ))}
      </div>

      <div style={{ padding:'12px 12px 80px' }}>
        {/* Monthly revenue highlight */}
        <div style={{ background:`linear-gradient(135deg,${col}22,${col}11)`, borderRadius:14, padding:16, marginBottom:14, border:`1px solid ${col}44`, textAlign:'center' }}>
          <div style={{ fontSize:10, color:P.muted, marginBottom:4 }}>UMSATZ {monthLabel.toUpperCase()}</div>
          <div style={{ fontSize:36, fontWeight:700, color:col }}>€ {totalRevenue.toLocaleString('de-DE')}</div>
          <div style={{ fontSize:10, color:P.muted, marginTop:4 }}>Ziel: € {(isT?5000:4000).toLocaleString('de-DE')}</div>
          <div style={{ height:6, background:P.raised, borderRadius:3, overflow:'hidden', marginTop:10 }}>
            <div style={{ height:'100%', width:`${Math.min((totalRevenue/(isT?5000:4000))*100,100)}%`, background:`linear-gradient(90deg,${col}88,${col})`, borderRadius:3, transition:'width 0.4s' }}/>
          </div>
        </div>

        {/* Goals */}
        <div style={{ background:P.card, borderRadius:12, padding:14, marginBottom:14, border:`1px solid ${P.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, color:P.muted, letterSpacing:2, marginBottom:12 }}>MONATSZIELE — {monthLabel.toUpperCase()}</div>
          {goals.map(g => {
            const val = Number(data[g.k] || 0);
            const pct = Math.min((val / g.target) * 100, 100);
            return (
              <div key={g.k} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:13 }}>{g.emoji} {g.l}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:12, color:val>=g.target?P.green:col, fontWeight:700 }}>{val} / {g.target}</span>
                    {val >= g.target && <span style={{ fontSize:14 }}>✅</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ flex:1, height:8, background:P.raised, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:pct>=100?P.green:col, borderRadius:4, transition:'width 0.3s' }}/>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={()=>updateGoal(isT?'T':'O', g.k, Math.max(0,val-1))} style={{ width:28, height:28, borderRadius:14, border:`1px solid ${P.border}`, background:P.raised, color:P.muted, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <button onClick={()=>updateGoal(isT?'T':'O', g.k, val+1)} style={{ width:28, height:28, borderRadius:14, border:'none', background:col, color:'#000', cursor:'pointer', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue input */}
        <div style={{ background:P.card, borderRadius:12, padding:14, marginBottom:14, border:`1px solid ${col}33` }}>
          <div style={{ fontSize:10, fontWeight:700, color:P.muted, letterSpacing:2, marginBottom:10 }}>UMSATZ EINTRAGEN</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:18, color:col }}>€</span>
            <input type="number" value={data.revenue || ''} onChange={e=>updateGoal(isT?'T':'O','revenue',Number(e.target.value))} placeholder="0"
              style={{ flex:1, background:P.raised, border:`1px solid ${P.border}`, borderRadius:8, padding:'12px', color:col, fontSize:20, outline:'none', fontWeight:700 }}/>
          </div>
        </div>

        {/* Notes */}
        <div style={{ background:P.card, borderRadius:12, padding:14, marginBottom:14, border:`1px solid ${P.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, color:P.muted, letterSpacing:2, marginBottom:8 }}>NOTIZEN & IDEEN</div>
          <textarea value={notes[isT?'T':'O']} onChange={e=>saveNotes(isT?'T':'O',e.target.value)} placeholder="Ideen, Strategien, To-Dos, Reflexionen…"
            style={{ ...inp, height:90, resize:'none' }}/>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ background:P.card, borderRadius:12, padding:14, marginBottom:14, border:`1px solid ${P.border}` }}>
            <div style={{ fontSize:10, fontWeight:700, color:P.muted, letterSpacing:2, marginBottom:10 }}>VERLAUF</div>
            {history.map((h,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #111C2A' }}>
                <span style={{ fontSize:12, fontWeight:700, color:P.muted }}>{h.monthLabel}</span>
                <span style={{ fontSize:14, color:col, fontWeight:700 }}>€ {Number(h.data.revenue||0).toLocaleString('de-DE')}</span>
              </div>
            ))}
          </div>
        )}

        {/* KI Business Coach */}
        <div style={{ background:P.card, borderRadius:12, padding:14, border:`1px solid ${col}33` }}>
          <div style={{ fontSize:10, fontWeight:700, color:col, letterSpacing:2, marginBottom:6 }}>🤖 KI BUSINESS-COACH</div>
          <div style={{ fontSize:10, color:P.muted, marginBottom:10 }}>Frag mich alles zu {label} — Strategie, Ideen, Optimierung.</div>
          <textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder={`z.B. "Wie kann ich meinen Umsatz bei ${label} steigern?" oder "Welche Content-Strategie empfiehlst du?"`}
            style={{ ...inp, height:70, resize:'none', marginBottom:8 }}/>
          <button onClick={askKI} disabled={aiLoading||!aiInput.trim()} style={{ width:'100%', padding:'10px', background:aiLoading?P.muted+'22':col+'22', border:`1px solid ${col}55`, borderRadius:8, color:aiLoading?P.muted:col, fontWeight:700, cursor:'pointer', fontSize:12 }}>
            {aiLoading ? '🤖 Denkt nach…' : '🤖 Fragen'}
          </button>
          {aiResult && (
            <div style={{ marginTop:10, background:P.raised, borderRadius:8, padding:12, fontSize:12, lineHeight:1.7 }}>
              {aiResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
