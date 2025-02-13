import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Remove from .env and move to deployment platform
// Delete .env from git and add to .gitignore

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Get public URL for assets in the public bucket
export const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from('assets').getPublicUrl(path);
  return data.publicUrl;
};