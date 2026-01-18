import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Config Check:');
  console.log('  URL exists:', !!supabaseUrl);
  console.log('  URL length:', supabaseUrl?.length || 0);
  console.log('  Anon Key exists:', !!supabaseAnonKey);
  console.log('  Anon Key length:', supabaseAnonKey?.length || 0);
  console.log('  Anon Key starts with eyJ:', supabaseAnonKey?.startsWith('eyJ') || false);
}

// Check if environment variables are missing or still have placeholder values
const hasValidConfig =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your-project-url-here' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon') &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 50; // Anon keys are typically long JWT tokens

// Only create client if config is valid, otherwise create a dummy client that will error on use
export const supabase = hasValidConfig
  ? (() => {
    try {
      const client = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
        },
      });
      console.log('✅ Supabase client initialized with persistent storage');
      return client;
    } catch (err) {
      console.error('❌ Failed to create Supabase client:', err);
      console.error('  URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing');
      console.error('  Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing');
      throw err;
    }
  })()
  : (() => {
    console.warn('⚠️ Supabase not configured. Please update .env.local with your Supabase credentials.');
    // Return a mock client that will throw helpful errors when used
    const errorMessage = 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.';
    return {
      from: () => {
        throw new Error(errorMessage);
      },
      auth: {
        signUp: async () => {
          throw new Error(errorMessage);
        },
        signInWithPassword: async () => {
          throw new Error(errorMessage);
        },
        signInWithOAuth: async () => {
          throw new Error(errorMessage);
        },
        signOut: async () => {
          throw new Error(errorMessage);
        },
        getUser: async () => {
          throw new Error(errorMessage);
        },
      }
    } as any;
  })();

