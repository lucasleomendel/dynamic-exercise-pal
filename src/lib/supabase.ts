import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient('your-supabase-url', 'your-anon-key');

export default supabase;