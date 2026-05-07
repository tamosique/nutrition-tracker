# 🌊 Riviera Planner — Setup Guide
## riviera-planner.vercel.app

---

## Was du brauchst (alles kostenlos):
1. **GitHub Account** ✓ (hast du)
2. **Supabase Account** → supabase.com
3. **Google Cloud Console** → console.cloud.google.com
4. **Vercel Account** → vercel.com

---

## SCHRITT 1 — Google Cloud Console (OAuth + Calendar)

1. Geh zu **console.cloud.google.com**
2. Neues Projekt erstellen → Name: `riviera-planner`
3. Links: **APIs & Services** → **Library**
4. Suche und aktiviere: **Google Calendar API** → Enable
5. Links: **APIs & Services** → **Credentials**
6. Klick **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
7. Application type: **Web application**
8. Name: `Riviera Planner`
9. Authorized JavaScript origins: `https://riviera-planner.vercel.app`
10. Authorized redirect URIs: `https://riviera-planner.vercel.app/api/auth/callback/google`
11. Klick **Create** → Kopiere **Client ID** und **Client Secret**

### OAuth Consent Screen:
12. Links: **OAuth consent screen**
13. User Type: **External** → Create
14. App name: `Riviera Planner`
15. Support email: deine E-Mail
16. **Scopes** → Add scopes: Google Calendar API (`/auth/calendar`)
17. **Test users** → Füge Tanjas und Olis E-Mail-Adressen hinzu
18. Save

---

## SCHRITT 2 — Supabase (Datenbank)

1. Geh zu **supabase.com** → Sign up with GitHub
2. **New Project** → Name: `riviera-planner`, Region: **West EU (Frankfurt)**
3. Warten bis bereit (~1 Minute)
4. Links: **SQL Editor** → Paste den Inhalt aus `supabase-schema.sql` → **Run**
5. Links: **Database** → **Replication** → Toggle `app_data` und `content_items` auf **ON**
6. Links: **Project Settings** → **API** → Kopiere:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## SCHRITT 3 — GitHub Repository

1. github.com → **"+"** → **New repository**
2. Name: `riviera-planner`, Visibility: **Private**
3. Create repository
4. Klick **"uploading an existing file"**
5. ZIP entpacken → ALLE Dateien rein ziehen
6. Commit: `Initial commit — Riviera Planner v1.0`

---

## SCHRITT 4 — Vercel (Hosting)

1. **vercel.com** → Sign up with GitHub
2. **Add New Project** → wähle `riviera-planner`
3. Framework: **Next.js** (wird automatisch erkannt)
4. **Environment Variables** — füge alle ein:

| Variable | Wert |
|----------|------|
| `GOOGLE_CLIENT_ID` | Aus Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Aus Google Cloud Console |
| `NEXTAUTH_SECRET` | Zufälliger String (min 32 Zeichen) |
| `NEXTAUTH_URL` | `https://riviera-planner.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Aus Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Aus Supabase |
| `TANJA_EMAIL` | Tanjas Google E-Mail |
| `OLI_EMAIL` | Olis Google E-Mail |
| `NEXT_PUBLIC_HOUSEHOLD_ID` | `tanja-oli-riviera-2026` |

> **NEXTAUTH_SECRET generieren:** Öffne Terminal: `openssl rand -base64 32`
> Oder verwende: https://generate-secret.vercel.app/32

5. Klick **Deploy** → warten ~2 Minuten
6. 🎉 App ist live unter: **riviera-planner.vercel.app**

---

## SCHRITT 5 — Als App auf Handy

### iPhone (Safari):
1. riviera-planner.vercel.app in Safari öffnen
2. Teilen-Button (□↑) → **"Zum Home-Bildschirm"**
3. App-Icon erscheint!

### Android (Chrome):
1. In Chrome öffnen
2. Drei Punkte → **"Zum Startbildschirm hinzufügen"**

---

## Einloggen

1. **riviera-planner.vercel.app** öffnen
2. **"Mit Google anmelden"** klicken
3. Tanja loggt sich mit ihrem Google ein → sieht ihren Kalender
4. Oli loggt sich mit seinem Google ein → sieht seinen Kalender
5. Beide sehen die **gleichen Planner-Daten** in Echtzeit!

---

## Wenn es Probleme gibt

**"Error: redirect_uri_mismatch"**
→ Google Cloud Console → Credentials → Authorized redirect URIs prüfen

**"Database error"**
→ Supabase SQL Editor → Schema nochmal ausführen

**Kalender wird nicht angezeigt**
→ Prüfe ob TANJA_EMAIL / OLI_EMAIL korrekt in Vercel gesetzt sind
→ Prüfe ob Google Calendar API aktiviert ist
→ Versuche dich neu einzuloggen

---

## Updates einspielen

Wenn ich (Claude) etwas verbessere:
1. Neue Datei(en) von mir erhalten
2. Im GitHub Repository ersetzen/hochladen
3. Vercel deployt **automatisch** innerhalb von 2 Minuten
4. Alle sehen sofort die neue Version! ✨

---

*Made with ❤️ for Tanja & Oli · Riviera Remote Life*
*@tamosique · @markolivertüttelmann · Côte d'Azur*
