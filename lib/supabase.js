import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

const HH = () => process.env.NEXT_PUBLIC_HOUSEHOLD_ID || 'default';

export async function saveData(key, value) {
  const { error } = await supabase.from('app_data')
    .upsert({ household_id: HH(), data_key: key, data_value: value }, { onConflict: 'household_id,data_key' });
  if (error) console.error('Save error:', error);
}

export async function loadData(key, def = null) {
  const { data, error } = await supabase.from('app_data')
    .select('data_value').eq('household_id', HH()).eq('data_key', key).single();
  if (error || !data) return def;
  return data.data_value;
}

export async function loadAllData() {
  const { data, error } = await supabase.from('app_data')
    .select('data_key, data_value').eq('household_id', HH());
  if (error) return {};
  return Object.fromEntries(data.map(d => [d.data_key, d.data_value]));
}

export function subscribeToChanges(callback) {
  return supabase.channel('app_data_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data',
      filter: `household_id=eq.${HH()}` }, callback)
    .subscribe();
}

// Content items
export async function getContentItems() {
  const { data } = await supabase.from('content_items')
    .select('*').eq('household_id', HH()).order('created_at', { ascending: false });
  return data || [];
}

export async function saveContentItem(item) {
  if (item.id && typeof item.id === 'number') {
    const { data } = await supabase.from('content_items')
      .update({ ...item, household_id: HH() }).eq('id', item.id).select().single();
    return data;
  }
  const { data } = await supabase.from('content_items')
    .insert({ ...item, household_id: HH() }).select().single();
  return data;
}

export async function deleteContentItem(id) {
  await supabase.from('content_items').delete().eq('id', id);
}

// Voice profiles
export async function getVoiceProfile(userId, channel) {
  const { data } = await supabase.from('voice_profiles')
    .select('*').eq('household_id', HH()).eq('user_id', userId).eq('channel', channel).single();
  return data;
}

export async function saveVoiceProfile(userId, channel, profile) {
  await supabase.from('voice_profiles')
    .upsert({ household_id: HH(), user_id: userId, channel, ...profile },
      { onConflict: 'household_id,user_id,channel' });
}
