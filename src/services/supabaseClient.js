import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

const hasConfiguration = Boolean(supabaseUrl || supabaseKey);
const hasValidConfiguration = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('your-anon-key') &&
  !supabaseKey.includes('your-publishable-key')
);

if (hasConfiguration && !hasValidConfiguration) {
  throw new Error(
    'Supabase configuration is incomplete. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).'
  );
}

export const isSupabaseConfigured = hasValidConfiguration;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

if (!isSupabaseConfigured) {
  console.info(
    '%c WEDORA SYSTEM INFO %c Operating in Interactive Demo Mode with persistent local storage. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to connect live Supabase.',
    'background: #0D1B2A; color: #D4AF37; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
    'color: #385680; font-weight: normal;'
  );
}
