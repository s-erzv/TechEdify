import { createClient } from '@supabase/supabase-js'; // PASTIKAN INI

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '*****' : 'Missing');

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); // PASTIKAN INI

// LOG SANGAT PENTING INI:
console.log("supabaseClient.js: Supabase client initialized:", supabase);
console.log("supabaseClient.js: Supabase auth object:", supabase.auth);
console.log("supabaseClient.js: Supabase auth signInWithPassword method (from client):", supabase.auth.signInWithPassword);