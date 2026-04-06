import { supabase } from './supabase';

/**
 * Returns an Authorization header object with the current Supabase session token.
 * Spread this into your fetch headers: { 'Content-Type': 'application/json', ...(await authHeader()) }
 */
export async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
