import { supabase } from './supabase';

export const SYNC_FIELDS = [
  'jobs',
  'companies',
  'profile',
  'streak',
  'achievements',
  'dark_mode',
  'cv_name',
  'cv_text',
  'market_value',
];

/**
 * Push full state snapshot to Supabase (upsert).
 * @param {string} userId
 * @param {object} data - keys matching SYNC_FIELDS
 */
export async function pushToSupabase(userId, data) {
  const { error } = await supabase
    .from('scout_user_data')
    .upsert(
      { id: userId, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (error) throw error;
}

/**
 * Pull state from Supabase for the given user.
 * Returns the data object or null if no row exists.
 * @param {string} userId
 */
export async function pullFromSupabase(userId) {
  const { data, error } = await supabase
    .from('scout_user_data')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
