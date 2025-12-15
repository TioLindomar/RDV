import { createClient } from '@supabase/supabase-js';

// O Vite expõe variáveis de ambiente com import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltam as variáveis de ambiente do Supabase no arquivo .env");
}

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};

// const supabaseUrl = 'https://nasaubochajhenxbbwrg.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F1Ym9jaGFqaGVueGJid3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzk3MjksImV4cCI6MjA3MzcxNTcyOX0.LYUFnbCsg6LAY3VWALJ_wjhd2jc1Sx1I4ZukzqgGV88';