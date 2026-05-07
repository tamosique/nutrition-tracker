'use client';
import { LEVELS, getLvl } from '@/lib/constants';

// Minimal elegant avatar — not cartoon, more like a stylized silhouette
export default function Avatar({ config = {}, xp = 0, size = 120, name = '', color = '#C9A84C' }) {
  const lvl = getLvl(xp);
  const {
    skinTone = '#D4A574',
    hairColor = '#2C1810',
    hairStyle = 'medium', // short, medium, long, bun
    outfitColor = color,
    accessory = 'none', // none, sunglasses, dog
    hasGlow = false,
  } = config;

  const glowColor = color + '66';
  const s = size;
  const cx = s / 2;

  // Hair paths by style
  const hairPaths = {
    short: `M${cx-14},${s*0.18} Q${cx},${s*0.08} ${cx+14},${s*0.18} Q${cx+16},${s*0.25} ${cx+14},${s*0.32} Q${cx},${s*0.28} ${cx-14},${s*0.32} Q${cx-16},${s*0.25} ${cx-14},${s*0.18}Z`,
    medium: `M${cx-14},${s*0.18} Q${cx},${s*0.06} ${cx+14},${s*0.18} L${cx+15},${s*0.38} Q${cx},${s*0.34} ${cx-15},${s*0.38}Z`,
    long: `M${cx-14},${s*0.18} Q${cx},${s*0.06} ${cx+14},${s*0.18} L${cx+16},${s*0.55} Q${cx},${s*0.50} ${cx-16},${s*0.55}Z`,
    bun: `M${cx-13},${s*0.19} Q${cx},${s*0.08} ${cx+13},${s*0.19} Q${cx+15},${s*0.27} ${cx},${s*0.26} Q${cx-15},${s*0.27} ${cx-13},${s*0.19}Z M${cx-5},${s*0.09} Q${cx},${s*0.04} ${cx+5},${s*0.09} Q${cx+6},${s*0.14} ${cx},${s*0.13} Q${cx-6},${s*0.14} ${cx-5},${s*0.09}Z`,
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Glow ring for higher levels */}
      {lvl >= 3 && (
        <div style={{
          position: 'absolute', top: -6, left: -6, right: -6, bottom: 30,
          borderRadius: '50%', border: `2px solid ${color}`,
          boxShadow: `0 0 ${8 + lvl * 4}px ${glowColor}`,
          pointerEvents: 'none',
        }} />
      )}

      <svg width={s} height={s * 1.1} viewBox={`0 0 ${s} ${s * 1.1}`} style={{ overflow: 'visible' }}>
        {/* Level badge */}
        {lvl >= 1 && (
          <g>
            <circle cx={s * 0.82} cy={s * 0.12} r={10} fill={color} />
            <text x={s * 0.82} y={s * 0.16} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#000">{lvl + 1}</text>
          </g>
        )}

        {/* Hair (behind head) */}
        <path d={hairPaths[hairStyle] || hairPaths.medium} fill={hairColor} />

        {/* Head */}
        <ellipse cx={cx} cy={s * 0.27} rx={13} ry={15} fill={skinTone} />

        {/* Eyes */}
        <ellipse cx={cx - 4} cy={s * 0.25} rx={1.8} ry={2} fill="#2C1810" />
        <ellipse cx={cx + 4} cy={s * 0.25} rx={1.8} ry={2} fill="#2C1810" />
        {/* Eye shine */}
        <circle cx={cx - 3.2} cy={s * 0.24} r={0.7} fill="white" />
        <circle cx={cx + 4.8} cy={s * 0.24} r={0.7} fill="white" />

        {/* Nose */}
        <ellipse cx={cx} cy={s * 0.29} rx={1} ry={0.8} fill={skinTone} stroke="#C4905A" strokeWidth="0.5" />

        {/* Smile */}
        <path d={`M${cx-3.5},${s*0.315} Q${cx},${s*0.335} ${cx+3.5},${s*0.315}`} fill="none" stroke="#C4905A" strokeWidth="1.2" strokeLinecap="round" />

        {/* Sunglasses accessory */}
        {accessory === 'sunglasses' && (
          <g>
            <rect x={cx - 8} y={s * 0.235} width={7} height={5} rx={2} fill="#1A1A2E" opacity={0.85} />
            <rect x={cx + 1} y={s * 0.235} width={7} height={5} rx={2} fill="#1A1A2E" opacity={0.85} />
            <line x1={cx - 1} y1={s * 0.237} x2={cx + 1} y2={s * 0.237} stroke="#555" strokeWidth="0.8" />
          </g>
        )}

        {/* Neck */}
        <rect x={cx - 4} y={s * 0.40} width={8} height={6} fill={skinTone} />

        {/* Body / Outfit */}
        <path d={`M${cx - 18},${s * 0.46} Q${cx - 14},${s * 0.43} ${cx},${s * 0.43} Q${cx + 14},${s * 0.43} ${cx + 18},${s * 0.46} L${cx + 16},${s * 0.78} Q${cx},${s * 0.82} ${cx - 16},${s * 0.78}Z`}
          fill={outfitColor} opacity={0.9} />

        {/* Arms */}
        <path d={`M${cx - 18},${s * 0.46} Q${cx - 22},${s * 0.55} ${cx - 20},${s * 0.68}`} fill="none" stroke={outfitColor} strokeWidth={6} strokeLinecap="round" />
        <path d={`M${cx + 18},${s * 0.46} Q${cx + 22},${s * 0.55} ${cx + 20},${s * 0.68}`} fill="none" stroke={outfitColor} strokeWidth={6} strokeLinecap="round" />

        {/* Hands */}
        <ellipse cx={cx - 20} cy={s * 0.70} rx={4} ry={3.5} fill={skinTone} />
        <ellipse cx={cx + 20} cy={s * 0.70} rx={4} ry={3.5} fill={skinTone} />

        {/* Legs */}
        <rect x={cx - 12} y={s * 0.78} width={9} height={20} rx={4} fill={outfitColor} opacity={0.7} />
        <rect x={cx + 3} y={s * 0.78} width={9} height={20} rx={4} fill={outfitColor} opacity={0.7} />

        {/* Feet */}
        <ellipse cx={cx - 7.5} cy={s * 0.985} rx={6} ry={3} fill="#2C1810" />
        <ellipse cx={cx + 7.5} cy={s * 0.985} rx={6} ry={3} fill="#2C1810" />

        {/* Dog accessory - little Chico/Sunny */}
        {accessory === 'dog' && (
          <g transform={`translate(${cx + 18}, ${s * 0.75})`}>
            <ellipse cx={0} cy={4} rx={7} ry={4} fill="#3D2B1F" />
            <circle cx={0} cy={-1} r={4} fill="#3D2B1F" />
            <ellipse cx={-2.5} cy={-4} rx={1.5} ry={2.5} fill="#2C1810" />
            <ellipse cx={2.5} cy={-4} rx={1.5} ry={2.5} fill="#2C1810" />
            <circle cx={0} cy={0} r={1.2} fill="#1A0A00" />
            <ellipse cx={0} cy={1} rx={1.5} ry={0.8} fill="#C47E5A" />
          </g>
        )}

        {/* Stars for high levels */}
        {lvl >= 4 && (
          <>
            <text x={s * 0.1} y={s * 0.15} fontSize="8" fill={color}>✨</text>
            <text x={s * 0.78} y={s * 0.40} fontSize="8" fill={color}>⭐</text>
          </>
        )}
      </svg>

      {/* Level label */}
      <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 2, letterSpacing: 1 }}>
        {LEVELS[lvl]}
      </div>
    </div>
  );
}

// Avatar customizer component
export function AvatarCustomizer({ config, onChange, color, label }) {
  const SKIN_TONES = ['#FDDBB4', '#D4A574', '#C68642', '#8D5524', '#4A2912'];
  const HAIR_COLORS = ['#2C1810', '#6B3A2A', '#A0522D', '#C4A35A', '#E8D5B7', '#1A1A2E', '#8B0000'];
  const HAIR_STYLES = [
    { id:'short', label:'Kurz' }, { id:'medium', label:'Mittel' },
    { id:'long', label:'Lang' }, { id:'bun', label:'Dutt' },
  ];
  const ACCESSORIES = [
    { id:'none', label:'Keins' }, { id:'sunglasses', label:'😎 Sonnenbrille' }, { id:'dog', label:'🐾 Hund' },
  ];

  return (
    <div>
      <div style={{ fontSize: 10, color: '#7A8BA8', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
        {label} ANPASSEN
      </div>

      {/* Skin tone */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: '#7A8BA8', marginBottom: 4 }}>Hautton</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {SKIN_TONES.map(tone => (
            <div key={tone} onClick={() => onChange({ ...config, skinTone: tone })}
              style={{ width: 22, height: 22, borderRadius: '50%', background: tone, cursor: 'pointer',
                border: config.skinTone === tone ? `3px solid ${color}` : '3px solid transparent',
                transition: 'border 0.2s' }} />
          ))}
        </div>
      </div>

      {/* Hair color */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: '#7A8BA8', marginBottom: 4 }}>Haarfarbe</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {HAIR_COLORS.map(c => (
            <div key={c} onClick={() => onChange({ ...config, hairColor: c })}
              style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer',
                border: config.hairColor === c ? `3px solid ${color}` : '3px solid transparent' }} />
          ))}
        </div>
      </div>

      {/* Hair style */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: '#7A8BA8', marginBottom: 4 }}>Frisur</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {HAIR_STYLES.map(hs => (
            <button key={hs.id} onClick={() => onChange({ ...config, hairStyle: hs.id })}
              style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700,
                background: config.hairStyle === hs.id ? color + '33' : '#243361',
                color: config.hairStyle === hs.id ? color : '#7A8BA8',
                border: config.hairStyle === hs.id ? `1px solid ${color}` : '1px solid #1E3055' }}>
              {hs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Outfit color */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: '#7A8BA8', marginBottom: 4 }}>Outfit-Farbe</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#C9A84C', '#4A90D9', '#48BB78', '#FC8181', '#B794F4', '#2C3E50', '#E8D5B7'].map(c => (
            <div key={c} onClick={() => onChange({ ...config, outfitColor: c })}
              style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                border: config.outfitColor === c ? `3px solid #fff` : '3px solid transparent' }} />
          ))}
        </div>
      </div>

      {/* Accessory */}
      <div>
        <div style={{ fontSize: 9, color: '#7A8BA8', marginBottom: 4 }}>Accessoire</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {ACCESSORIES.map(a => (
            <button key={a.id} onClick={() => onChange({ ...config, accessory: a.id })}
              style={{ padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700,
                background: config.accessory === a.id ? color + '33' : '#243361',
                color: config.accessory === a.id ? color : '#7A8BA8',
                border: config.accessory === a.id ? `1px solid ${color}` : '1px solid #1E3055' }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
