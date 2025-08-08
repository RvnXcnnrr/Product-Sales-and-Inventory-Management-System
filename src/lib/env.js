// Environment variables (no hardcoded fallbacks to avoid silent typos)
export const ENV_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL?.trim(),
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  APP_NAME: import.meta.env.VITE_APP_NAME || 'POS & Inventory Management',
  DEV_MODE: import.meta.env.VITE_DEV_MODE !== 'false'
}

if (import.meta.env.DEV) {
  console.log('Environment Configuration:', {
    urlPresent: !!ENV_CONFIG.SUPABASE_URL,
    keyPresent: !!ENV_CONFIG.SUPABASE_ANON_KEY,
    app: ENV_CONFIG.APP_NAME,
    mode: import.meta.env.MODE
  })
}

if (!ENV_CONFIG.SUPABASE_URL || !ENV_CONFIG.SUPABASE_ANON_KEY) {
  console.error('[env] Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Create a .env.local file.')
}
