import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam variáveis de ambiente do Supabase (VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
