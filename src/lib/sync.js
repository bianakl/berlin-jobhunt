import { supabase } from './supabase';
import market from '../config/market';

export const SYNC_FIELDS = [
  'jobs',
  'companies',
  'profile',
  'streak',
  'achievements',
  'dark_mode',
  'cv_name',
  // cv_text and market_value are localStorage-only:
  // cv_text is high-sensitivity PII (full CV); market_value is regeneratable.
];

/**
 * Push full state snapshot to Supabase (upsert).
 * Scoped by (id, market) so the Berlin and US deployments never mix data
 * for a shared account.
 * @param {string} userId
 * @param {object} data - keys matching SYNC_FIELDS
 */
export async function pushToSupabase(userId, data) {
  const { error } = await supabase
    .from('scout_user_data')
    .upsert(
      { id: userId, market: market.id, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'id,market' }
    );
  if (error) throw error;
}

/**
 * Pull state from Supabase for the given user, scoped to this deployment's market.
 * Returns the data object or null if no row exists.
 * @param {string} userId
 */
export async function pullFromSupabase(userId) {
  const { data, error } = await supabase
    .from('scout_user_data')
    .select('jobs, companies, profile, streak, achievements, dark_mode, cv_name')
    .eq('id', userId)
    .eq('market', market.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
