-- Riviera Planner — Supabase Schema
-- Im SQL Editor ausführen

-- Haupttabelle: Key-Value Store pro Haushalt
CREATE TABLE IF NOT EXISTS app_data (
  id BIGSERIAL PRIMARY KEY,
  household_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, data_key)
);

-- Voice Profiles (pro User)
CREATE TABLE IF NOT EXISTS voice_profiles (
  id BIGSERIAL PRIMARY KEY,
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL, -- 'T' oder 'O'
  channel TEXT NOT NULL, -- 'personal' oder 'tamosique'
  language TEXT NOT NULL DEFAULT 'de',
  style_description TEXT,
  hook_style TEXT,
  example_phrases TEXT,
  avoid_phrases TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id, channel)
);

-- Content Pipeline
CREATE TABLE IF NOT EXISTS content_items (
  id BIGSERIAL PRIMARY KEY,
  household_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idee', -- idee, geplant, gedreht, schnitt, live
  platform TEXT,
  language TEXT,
  script TEXT,
  notes TEXT,
  scheduled_date TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_access_app_data" ON app_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_voice" ON voice_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_access_content" ON content_items FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_data_household ON app_data(household_id);
CREATE INDEX IF NOT EXISTS idx_content_household ON content_items(household_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content_items(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_app_data BEFORE UPDATE ON app_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_content BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Real-time
ALTER TABLE app_data REPLICA IDENTITY FULL;
ALTER TABLE content_items REPLICA IDENTITY FULL;
