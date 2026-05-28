import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Server-side Supabase client
 * Usado para operações que precisam de privilégios elevados ou contexto server
 * Em Vite+React, este cliente pode ser usado em endpoints API ou Workers
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.warn('Missing VITE_SUPABASE_URL environment variable');
}

// Se houver uma service key, usar com privilégios elevados
// Caso contrário, usar a chave pública (mais seguro para o browser)
const key = supabaseServiceKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!key) {
  throw new Error('Faltam variáveis de ambiente do Supabase (chave de serviço ou pública)');
}

export const supabaseServer = createClient<Database>(supabaseUrl!, key, {
  auth: {
    persistSession: false, // Server-side não persiste sessão
  },
});
