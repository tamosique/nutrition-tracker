'use client';
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  if (status === 'authenticated') return null;

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080F1E' }}>
        <div style={{ color: '#C9A84C', fontSize: 18, letterSpacing: 3 }}>LADEN…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0F1E3A 0%,#080F1E 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🌊</div>
        <div style={{ color: '#C9A84C', fontSize: 10, letterSpacing: 5, fontWeight: 700, marginBottom: 6 }}>
          RIVIERA PLANNER
        </div>
        <div style={{ color: '#7A8BA8', fontSize: 13 }}>
          Tanja &amp; Oli · Côte d'Azur
        </div>
        <div style={{ color: '#7A8BA8', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
          "Leben. Arbeiten. Genießen."
        </div>
      </div>

      {/* Login card */}
      <div style={{ background: '#1A2744', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, border: '1px solid #C9A84C33', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 14, color: '#F0F4FF', fontWeight: 700, marginBottom: 6 }}>
            Mit Google einloggen
          </div>
          <div style={{ fontSize: 11, color: '#7A8BA8', lineHeight: 1.5 }}>
            Jeder loggt sich mit seinem eigenen Google-Account ein.<br />
            Tanja → Tamosique Account · Oli → Sein Account
          </div>
        </div>

        <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', color: '#1A1A1A', fontWeight: 700, fontSize: 14, transition: 'opacity 0.2s' }}
          onMouseOver={e => e.target.style.opacity = '0.9'} onMouseOut={e => e.target.style.opacity = '1'}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Mit Google anmelden
        </button>

        <div style={{ marginTop: 20, padding: '12px', background: '#0F1E3A', borderRadius: 10, border: '1px solid #1E3055' }}>
          <div style={{ fontSize: 9, color: '#7A8BA8', textAlign: 'center', lineHeight: 1.6 }}>
            🔐 Sicher · Jeder sieht die gleichen Daten · Google Kalender wird verknüpft<br />
            Tanja: Tanjas Kalender · Oli: Olis Kalender
          </div>
        </div>
      </div>

      {/* Dogs */}
      <div style={{ marginTop: 32, fontSize: 28 }}>🐾🐾</div>
      <div style={{ fontSize: 10, color: '#3A4A6A', marginTop: 4 }}>Chico & Sunny warten auf euch</div>
    </div>
  );
}
