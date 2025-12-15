import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nasaubochajhenxbbwrg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2F1Ym9jaGFqaGVueGJid3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzk3MjksImV4cCI6MjA3MzcxNTcyOX0.LYUFnbCsg6LAY3VWALJ_wjhd2jc1Sx1I4ZukzqgGV88';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
