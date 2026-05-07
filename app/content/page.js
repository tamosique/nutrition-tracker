'use client';
import { useState, useEffect } from 'react';
import { generateScript } from '@/lib/ai-client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getContentItems, saveContentItem, deleteContentItem, getVoiceProfile, saveVoiceProfile } from '@/lib/supabase';
import { P, PIPELINE_STAGES, CHANNELS, MONACO_EVENTS } from '@/lib/constants';

const inp = { background:'#243361', border:'1px solid #1E3055', borderRadius:8, padding:'9px 12px', color:'#F0F4FF', fontSize:12, outline:'none', width:'100%' };

export default function ContentStudio() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status]);

  const [tab, setTab] = useState('pipeline');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ title:'', channel:'tamosique', status:'idee', platform:'Instagram', language:'de', notes:'' });
  // Script generator
  const [scriptMode, setScriptMode] = useState('location'); // location, translate, caption
  const [scriptInput, setScriptInput] = useState({ location:'', bulletPoints:'', transcriptFR:'', caption:'' });
  const [targetLang, setTargetLang] = useState('both');
  const [scriptChannel, setScriptChannel] = useState('tamosique');
  const [scriptResult, setScriptResult] = useState(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  // Voice profiles
  const [voiceT, setVoiceT] = useState({ style_description:'', hook_style:'', example_phrases:'', avoid_phrases:'' });
  const [voiceO, setVoiceO] = useState({ style_description:'', hook_style:'', example_phrases:'', avoid_phrases:'' });
  const [voiceTab, setVoiceTab] = useState('T');
  const [voiceSaved, setVoiceSaved] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const [its, vT, vO] = await Promise.all([
        getContentItems(),
        getVoiceProfile('T', 'personal'),
        getVoiceProfile('O', 'personal'),
      ]);
      setItems(its);
      if (vT) setVoiceT(vT);
      if (vO) setVoiceO(vO);
      setLoading(false);
    })();
  }, [session]);

  async function addItem() {
    if (!newItem.title.trim()) return;
    const saved = await saveContentItem(newItem);
    if (saved) setItems(prev => [saved, ...prev]);
    setNewItem({ title:'', channel:'tamosique', status:'idee', platform:'Instagram', language:'de', notes:'' });
    setShowAdd(false);
  }

  async function moveItem(id, newStatus) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const updated = await saveContentItem({ ...item, status: newStatus });
    setItems(prev => prev.map(i => i.id === id ? (updated || { ...i, status: newStatus }) : i));
  }

  async function removeItem(id) {
    await deleteContentItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function generateScriptFn() {
    setScriptLoading(true); setScriptResult(null);
    try {
      const voiceProfile = voiceTab === 'T' ? voiceT : voiceO;
      const voiceStyle = voiceProfile?.style_description || 'locker, authentisch';
      const result = await generateScript(scriptMode, {
        mode: scriptMode,
        location: scriptInput.location,
        bulletPoints: scriptInput.bulletPoints,
        transcript: scriptInput.transcriptFR,
        topic: scriptInput.caption,
        channel: scriptChannel,
        lang: targetLang,
        voiceStyle,
      });
      setScriptResult(result);
    } catch(e) {
      console.error(e);
      setScriptResult({ error: '❌ ' + e.message + ' — ANTHROPIC_API_KEY in Vercel prüfen!' });
    }
    setScriptLoading(false);
  }

  async function saveVoiceProfiles() {
    await Promise.all([
      saveVoiceProfile('T', 'personal', voiceT),
      saveVoiceProfile('O', 'personal', voiceO),
    ]);
    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 2000);
  }

  const stageItems = (stageId) => items.filter(i => i.status === stageId);

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:P.bg, color:P.gold, fontSize:18, letterSpacing:3 }}>LADEN…</div>;

  return (
    <div style={{ background:P.bg, minHeight:'100vh', maxWidth:480, margin:'0 auto', fontFamily:"'Segoe UI',sans-serif", color:'#F0F4FF' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(160deg,#1A2744,#080F1E)', borderBottom:'1px solid #7A5F2A', padding:'14px 16px 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'#C9A84C', fontSize:8, letterSpacing:4, fontWeight:700, marginBottom:3 }}>CONTENT STUDIO</div>
            <div style={{ fontSize:12, color:'#7A8BA8' }}>@tamosique · @markolivertüttelmann</div>
          </div>
          <button onClick={()=>router.push('/dashboard')} style={{ background:'transparent', border:'1px solid #1E3055', borderRadius:8, padding:'6px 12px', color:'#7A8BA8', fontSize:11, cursor:'pointer' }}>← Dashboard</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'#080F1E', borderBottom:'1px solid #1E3055' }}>
        {[['pipeline','PIPELINE'],['script','KI SKRIPT'],['events','MONACO'],['voice','VOICE']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:'10px 2px', background:'none', border:'none', cursor:'pointer', color:tab===k?'#C9A84C':'#7A8BA8', borderBottom:tab===k?'2px solid #C9A84C':'2px solid transparent', fontSize:9, fontWeight:700, letterSpacing:1.2 }}>{l}</button>
        ))}
      </div>

      <div style={{ padding:'10px 10px 80px' }}>

        {/* ══ PIPELINE ══ */}
        {tab === 'pipeline' && <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:12, color:'#C9A84C', fontWeight:700 }}>{items.length} Content-Stücke insgesamt</div>
            <button onClick={()=>setShowAdd(!showAdd)} style={{ padding:'7px 14px', background:'#C9A84C', border:'none', borderRadius:8, color:'#000', fontWeight:700, fontSize:12, cursor:'pointer' }}>+ Neu</button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div style={{ background:'#1A2744', borderRadius:10, padding:14, marginBottom:12, border:'1px solid #C9A84C44' }}>
              <input value={newItem.title} onChange={e=>setNewItem(i=>({...i,title:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="Titel / Idee…" style={{ ...inp, marginBottom:8 }}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                <select value={newItem.channel} onChange={e=>setNewItem(i=>({...i,channel:e.target.value}))} style={{ background:'#243361', border:'1px solid #1E3055', borderRadius:7, padding:'8px', color:'#F0F4FF', fontSize:11, outline:'none' }}>
                  {CHANNELS.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
                <select value={newItem.platform} onChange={e=>setNewItem(i=>({...i,platform:e.target.value}))} style={{ background:'#243361', border:'1px solid #1E3055', borderRadius:7, padding:'8px', color:'#F0F4FF', fontSize:11, outline:'none' }}>
                  {['Instagram','TikTok','YouTube Shorts','YouTube','Stories','Reels'].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <textarea value={newItem.notes} onChange={e=>setNewItem(i=>({...i,notes:e.target.value}))} placeholder="Notizen, Ideen, Links…" style={{ ...inp, height:60, resize:'none', marginBottom:8 }}/>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={addItem} style={{ flex:1, padding:'9px', background:'#C9A84C', border:'none', borderRadius:8, color:'#000', fontWeight:700, cursor:'pointer', fontSize:12 }}>Hinzufügen ✓</button>
                <button onClick={()=>setShowAdd(false)} style={{ padding:'9px 14px', background:'#243361', border:'1px solid #1E3055', borderRadius:8, color:'#7A8BA8', cursor:'pointer', fontSize:12 }}>✕</button>
              </div>
            </div>
          )}

          {/* Pipeline stages */}
          {PIPELINE_STAGES.map(stage => {
            const stageItems = items.filter(i => i.status === stage.id);
            return (
              <div key={stage.id} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:14 }}>{stage.emoji}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:stage.color, letterSpacing:1 }}>{stage.label}</span>
                  <span style={{ fontSize:10, color:'#7A8BA8', background:'#243361', borderRadius:10, padding:'1px 7px' }}>{stageItems.length}</span>
                </div>
                {stageItems.length === 0 && (
                  <div style={{ background:'#1A2744', borderRadius:8, padding:'12px', textAlign:'center', color:'#3A4A6A', fontSize:11, border:'1px dashed #1E3055' }}>Nichts hier</div>
                )}
                {stageItems.map(item => {
                  const ch = CHANNELS.find(c=>c.id===item.channel) || CHANNELS[0];
                  const currIdx = PIPELINE_STAGES.findIndex(s=>s.id===item.status);
                  return (
                    <div key={item.id} style={{ background:'#1A2744', borderRadius:10, padding:'10px 12px', marginBottom:6, border:`1px solid ${stage.color}33` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, fontWeight:700 }}>{item.title}</span>
                        <button onClick={()=>removeItem(item.id)} style={{ background:'transparent', border:'none', color:'#7A8BA8', cursor:'pointer', fontSize:14, padding:'0 2px' }}>✕</button>
                      </div>
                      <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:ch.color+'22', color:ch.color, border:`1px solid ${ch.color}44` }}>{ch.emoji} {ch.label}</span>
                        {item.platform && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:'#243361', color:'#7A8BA8' }}>{item.platform}</span>}
                        {item.language && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:'#243361', color:'#7A8BA8' }}>{item.language.toUpperCase()}</span>}
                      </div>
                      {item.notes && <div style={{ fontSize:10, color:'#7A8BA8', marginBottom:8 }}>{item.notes}</div>}
                      <div style={{ display:'flex', gap:4 }}>
                        {currIdx > 0 && (
                          <button onClick={()=>moveItem(item.id, PIPELINE_STAGES[currIdx-1].id)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #1E3055', background:'#243361', color:'#7A8BA8', fontSize:9, cursor:'pointer' }}>← Zurück</button>
                        )}
                        {currIdx < PIPELINE_STAGES.length - 1 && (
                          <button onClick={()=>moveItem(item.id, PIPELINE_STAGES[currIdx+1].id)} style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${PIPELINE_STAGES[currIdx+1].color}55`, background:PIPELINE_STAGES[currIdx+1].color+'22', color:PIPELINE_STAGES[currIdx+1].color, fontSize:9, cursor:'pointer', fontWeight:700 }}>
                            {PIPELINE_STAGES[currIdx+1].emoji} {PIPELINE_STAGES[currIdx+1].label} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>}

        {/* ══ SCRIPT GENERATOR ══ */}
        {tab === 'script' && <>
          {/* Mode tabs */}
          <div style={{ display:'flex', gap:5, marginBottom:12 }}>
            {[['location','📍 Ort → Skript'],['translate','🇫🇷 FR → DE/EN'],['caption','✍️ Caption']].map(([k,l])=>(
              <button key={k} onClick={()=>{setScriptMode(k);setScriptResult(null);}} style={{ flex:1, padding:'8px 4px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:10, background:scriptMode===k?'#C9A84C33':'#1E3055', color:scriptMode===k?'#C9A84C':'#7A8BA8', border:scriptMode===k?'1px solid #C9A84C':'1px solid #1E3055' }}>{l}</button>
            ))}
          </div>

          <div style={{ background:'#1A2744', borderRadius:10, padding:14, marginBottom:12, border:'1px solid #1E3055' }}>
            {/* Channel */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:'#7A8BA8', marginBottom:4, fontWeight:700 }}>KANAL</div>
              <div style={{ display:'flex', gap:6 }}>
                {CHANNELS.map(ch=>(
                  <button key={ch.id} onClick={()=>setScriptChannel(ch.id)} style={{ flex:1, padding:'7px', borderRadius:7, border:`1px solid ${scriptChannel===ch.id?ch.color:'#1E3055'}`, cursor:'pointer', background:scriptChannel===ch.id?ch.color+'33':'#243361', color:scriptChannel===ch.id?ch.color:'#7A8BA8', fontSize:10, fontWeight:700 }}>
                    {ch.emoji} {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:'#7A8BA8', marginBottom:4, fontWeight:700 }}>SPRACHE</div>
              <div style={{ display:'flex', gap:5 }}>
                {[['de','🇩🇪 Deutsch'],['en','🇬🇧 English'],['both','🇩🇪+🇬🇧 Beides']].map(([k,l])=>(
                  <button key={k} onClick={()=>setTargetLang(k)} style={{ flex:1, padding:'6px 4px', borderRadius:7, border:'none', cursor:'pointer', fontSize:9, fontWeight:700, background:targetLang===k?'#C9A84C33':'#243361', color:targetLang===k?'#C9A84C':'#7A8BA8', border:targetLang===k?'1px solid #C9A84C':'1px solid #1E3055' }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Location mode */}
            {scriptMode === 'location' && <>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:9, color:'#7A8BA8', marginBottom:4 }}>ORT / RESTAURANT / SPOT</div>
                <input value={scriptInput.location} onChange={e=>setScriptInput(i=>({...i,location:e.target.value}))} placeholder='z.B. "Restaurant Le Louis XV Monaco, Michelin-Sterne, Terrasse"' style={inp}/>
              </div>
              <div>
                <div style={{ fontSize:9, color:'#7A8BA8', marginBottom:4 }}>STICHPUNKTE / HIGHLIGHTS</div>
                <textarea value={scriptInput.bulletPoints} onChange={e=>setScriptInput(i=>({...i,bulletPoints:e.target.value}))} placeholder="- Beste Aussicht auf den Hafen&#10;- Spezialität: lokaler Fisch&#10;- Geheimtipp: Tisch am Rand reservieren" style={{ ...inp, height:80, resize:'none' }}/>
              </div>
            </>}

            {/* Translate mode */}
            {scriptMode === 'translate' && (
              <div>
                <div style={{ fontSize:9, color:'#7A8BA8', marginBottom:4 }}>FRANZÖSISCHES TRANSKRIPT / TEXT</div>
                <textarea value={scriptInput.transcriptFR} onChange={e=>setScriptInput(i=>({...i,transcriptFR:e.target.value}))} placeholder="Füge hier den französischen Text / Transkript ein…" style={{ ...inp, height:100, resize:'none' }}/>
              </div>
            )}

            {/* Caption mode */}
            {scriptMode === 'caption' && (
              <div>
                <div style={{ fontSize:9, color:'#7A8BA8', marginBottom:4 }}>BESCHREIBUNG / THEMA</div>
                <textarea value={scriptInput.caption} onChange={e=>setScriptInput(i=>({...i,caption:e.target.value}))} placeholder="Worum geht's? Was soll die Caption vermitteln?" style={{ ...inp, height:80, resize:'none' }}/>
              </div>
            )}
          </div>

          <button onClick={generateScriptFn} disabled={scriptLoading} style={{ width:'100%', padding:'12px', background:scriptLoading?'#243361':'#C9A84C22', border:'1px solid #C9A84C55', borderRadius:10, color:scriptLoading?'#7A8BA8':'#C9A84C', fontWeight:700, cursor:scriptLoading?'default':'pointer', fontSize:13, marginBottom:12 }}>
            {scriptLoading ? '🤖 KI erstellt Skript…' : '🤖 Skript generieren'}
          </button>

          {/* Script result */}
          {scriptResult && (
            <div className="slide-in">
              {scriptResult.hook && (
                <div style={{ background:'#2A0F35', borderRadius:10, padding:12, marginBottom:8, border:'1px solid #4A2A9F44' }}>
                  <div style={{ fontSize:9, color:'#B794F4', fontWeight:700, marginBottom:4 }}>⚡ HOOK (erste 3 Sekunden)</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{scriptResult.hook}</div>
                </div>
              )}
              {scriptResult.script_de && (
                <div style={{ background:'#12243F', borderRadius:10, padding:12, marginBottom:8, border:'1px solid #2A5A9F44' }}>
                  <div style={{ fontSize:9, color:'#4A90D9', fontWeight:700, marginBottom:6 }}>🇩🇪 DEUTSCH</div>
                  <div style={{ fontSize:12, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{scriptResult.script_de}</div>
                </div>
              )}
              {scriptResult.script_en && (
                <div style={{ background:'#0F2A18', borderRadius:10, padding:12, marginBottom:8, border:'1px solid #2A6A3A44' }}>
                  <div style={{ fontSize:9, color:'#48BB78', fontWeight:700, marginBottom:6 }}>🇬🇧 ENGLISH</div>
                  <div style={{ fontSize:12, lineHeight:1.6, whiteSpace:'pre-wrap' }}>{scriptResult.script_en}</div>
                </div>
              )}
              {scriptResult.captions && (
                <div style={{ background:'#1A2744', borderRadius:10, padding:12, marginBottom:8, border:'1px solid #1E3055' }}>
                  <div style={{ fontSize:9, color:'#C9A84C', fontWeight:700, marginBottom:6 }}>📝 CAPTIONS</div>
                  {scriptResult.captions.de && <div style={{ fontSize:11, marginBottom:6, color:'#F0F4FF' }}><span style={{ color:'#7A8BA8' }}>DE: </span>{scriptResult.captions.de}</div>}
                  {scriptResult.captions.en && <div style={{ fontSize:11, color:'#F0F4FF' }}><span style={{ color:'#7A8BA8' }}>EN: </span>{scriptResult.captions.en}</div>}
                </div>
              )}
              {scriptResult.hashtags?.length > 0 && (
                <div style={{ background:'#1A2744', borderRadius:10, padding:12, marginBottom:8, border:'1px solid #1E3055' }}>
                  <div style={{ fontSize:9, color:'#C9A84C', fontWeight:700, marginBottom:6 }}>🏷️ HASHTAGS</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {scriptResult.hashtags.map(h=>(
                      <span key={h} style={{ fontSize:10, padding:'3px 8px', borderRadius:10, background:'#243361', color:'#4A90D9' }}>{h}</span>
                    ))}
                  </div>
                </div>
              )}
              {scriptResult.tips?.length > 0 && (
                <div style={{ background:'#201A08', borderRadius:10, padding:12, border:'1px solid #6A5A1844' }}>
                  <div style={{ fontSize:9, color:'#C9A84C', fontWeight:700, marginBottom:6 }}>💡 DREHTIPPS</div>
                  {scriptResult.tips.map((t,i)=><div key={i} style={{ fontSize:11, color:'#F0F4FF', marginBottom:4 }}>• {t}</div>)}
                </div>
              )}
              {/* Save to pipeline */}
              <button onClick={async()=>{
                await saveContentItem({ title:`[Skript] ${scriptInput.location||'Neues Skript'}`, channel:scriptChannel, status:'geplant', script:JSON.stringify(scriptResult), language:targetLang });
                const its = await getContentItems(); setItems(its);
                setTab('pipeline'); }} style={{ width:'100%', padding:'10px', background:'#48BB7822', border:'1px solid #48BB78', borderRadius:8, color:'#48BB78', fontWeight:700, cursor:'pointer', fontSize:12, marginTop:8 }}>
                → In Pipeline speichern
              </button>
            </div>
          )}
        </>}

        {/* ══ MONACO EVENTS ══ */}
        {tab === 'events' && <>
          <div style={{ fontSize:12, color:'#C9A84C', fontWeight:700, marginBottom:12 }}>🎯 Monaco & Riviera Events 2026</div>
          {MONACO_EVENTS.map(ev=>{
            const eventDate = new Date(ev.date);
            const isPast = eventDate < new Date();
            const daysUntil = Math.ceil((eventDate - new Date()) / (1000*60*60*24));
            return (
              <div key={ev.date} style={{ background:'#1A2744', borderRadius:10, padding:'12px 14px', marginBottom:8, border:`1px solid ${ev.important?'#C9A84C44':'#1E3055'}`, opacity:isPast?0.5:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ fontSize:22 }}>{ev.emoji}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:ev.important?'#C9A84C':'#F0F4FF' }}>{ev.name}</div>
                      <div style={{ fontSize:10, color:'#7A8BA8', marginTop:2 }}>
                        {eventDate.toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'})}
                        {ev.end && ev.end !== ev.date && ` — ${new Date(ev.end).toLocaleDateString('de-DE',{day:'numeric',month:'long'})}`}
                      </div>
                      <span style={{ fontSize:8, padding:'2px 7px', borderRadius:10, background:'#243361', color:'#7A8BA8', marginTop:4, display:'inline-block' }}>{ev.cat}</span>
                    </div>
                  </div>
                  {!isPast && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:700, color:daysUntil<=7?'#FC8181':daysUntil<=30?'#F6AD55':'#48BB78' }}>{daysUntil}d</div>
                      <div style={{ fontSize:8, color:'#7A8BA8' }}>verbleibend</div>
                    </div>
                  )}
                </div>
                {!isPast && (
                  <button onClick={()=>{ setTab('script'); setScriptInput(i=>({...i,location:ev.name+', Monaco',bulletPoints:`- ${ev.cat} Event in Monaco\n- Datum: ${eventDate.toLocaleDateString('de-DE')}\n- `})); }} style={{ marginTop:8, padding:'5px 10px', background:'#4A90D922', border:'1px solid #4A90D955', borderRadius:6, color:'#4A90D9', fontSize:9, fontWeight:700, cursor:'pointer' }}>
                    ✏️ Skript dafür erstellen
                  </button>
                )}
              </div>
            );
          })}
        </>}

        {/* ══ VOICE PROFILES ══ */}
        {tab === 'voice' && <>
          <div style={{ fontSize:11, color:'#7A8BA8', marginBottom:12, lineHeight:1.6 }}>
            Definiere wie die KI für euch schreibt. Je genauer ihr das ausfüllt, desto mehr klingt das Skript wie ihr — nicht wie eine generische KI.
          </div>

          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            {[['T','TANJA','#C9A84C'],['O','OLI','#4A90D9']].map(([w,nm,col])=>(
              <button key={w} onClick={()=>setVoiceTab(w)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${voiceTab===w?col:'#1E3055'}`, cursor:'pointer', fontWeight:700, fontSize:12, background:voiceTab===w?col+'33':'#243361', color:voiceTab===w?col:'#7A8BA8' }}>{nm}</button>
            ))}
          </div>

          {[['T',voiceT,setVoiceT,'#C9A84C'],['O',voiceO,setVoiceO,'#4A90D9']].map(([w,vp,setVp,col])=>voiceTab===w&&(
            <div key={w}>
              <div style={{ background:'#1A2744', borderRadius:10, padding:14, marginBottom:8, border:`1px solid ${col}33` }}>
                <div style={{ fontWeight:700, fontSize:13, color:col, marginBottom:12 }}>{w==='T'?'TANJA':'OLI'} — Sprachprofil</div>

                {[
                  ['style_description', '🎤 Sprachstil', 'z.B. "locker, direkt, sage oft \'krass\' und \'mega\', kurze Sätze, kein Hochdeutsch, duze immer"'],
                  ['hook_style', '⚡ Hook-Stil (erste 3 Sekunden)', 'z.B. "Immer eine provokante Frage, z.B. Wusstest du dass...?" oder "Starte mit einem Fakt"'],
                  ['example_phrases', '✅ Typische Phrasen (die ich wirklich sage)', 'z.B. "Boah krass, das muss ich euch zeigen..." oder "Guys, das ist so gut..."'],
                  ['avoid_phrases', '❌ Vermeiden (Phrasen die unnatürlich klingen)', 'z.B. "Hallo liebe Community", "In diesem Video", "Schaut euch das an"'],
                ].map(([k,label,placeholder])=>(
                  <div key={k} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#7A8BA8', marginBottom:4 }}>{label}</div>
                    <textarea value={vp[k]} onChange={e=>setVp(p=>({...p,[k]:e.target.value}))} placeholder={placeholder}
                      style={{ ...inp, height:65, resize:'none' }}/>
                  </div>
                ))}
              </div>

              {/* Channel-specific tips */}
              <div style={{ background:'#243361', borderRadius:10, padding:12, marginBottom:12, border:'1px solid #1E3055' }}>
                <div style={{ fontSize:10, color:'#C9A84C', fontWeight:700, marginBottom:6 }}>💡 TIPPS FÜR BESSERE SKRIPTE</div>
                <div style={{ fontSize:10, color:'#7A8BA8', lineHeight:1.7 }}>
                  • Fülle mindestens Sprachstil + typische Phrasen aus<br/>
                  • Je mehr echte Beispiele, desto besser die KI<br/>
                  • Aktualisiere wenn sich dein Stil ändert<br/>
                  • Teste mit einem Location-Skript und pass es an
                </div>
              </div>
            </div>
          ))}

          <button onClick={saveVoiceProfiles} style={{ width:'100%', padding:'12px', background:voiceSaved?'#48BB7822':'#C9A84C22', border:`1px solid ${voiceSaved?'#48BB78':'#C9A84C55'}`, borderRadius:10, color:voiceSaved?'#48BB78':'#C9A84C', fontWeight:700, cursor:'pointer', fontSize:13 }}>
            {voiceSaved ? '✓ Gespeichert!' : '💾 Voice Profile speichern'}
          </button>
        </>}

      </div>
    </div>
  );
}
