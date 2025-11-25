import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are missing or still have placeholder values
const hasValidConfig = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your-project-url-here' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon') &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co');

// Only create client if config is valid, otherwise create a dummy client that will error on use
export const supabase = hasValidConfig
  ? (() => {
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase client initialized');
        return client;
      } catch (err) {
        console.error('❌ Failed to create Supabase client:', err);
        throw err;
      }
    })()
  : (() => {
      console.warn('⚠️ Supabase not configured. Please update .env.local with your Supabase credentials.');
      // Return a mock client that will throw helpful errors when used
      return {
        from: () => {
          throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
        }
      } as any;
    })();

