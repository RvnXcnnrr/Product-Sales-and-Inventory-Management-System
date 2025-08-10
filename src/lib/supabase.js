// Supabase client setup with helpers
import { createClient } from '@supabase/supabase-js'
import { ENV_CONFIG } from './env.js'

// Table name constants
export const TABLES = {
  PROFILES: 'profiles',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  TRANSACTION_ITEMS: 'transaction_items',
  INVENTORY_LOGS: 'inventory_logs',
  STORES: 'stores',
  STORE_USERS: 'store_users'
}

// Offline data helpers (localStorage based)
export const setOfflineData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to persist data offline:', e)
  }
}

export const getOfflineData = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.warn('Failed to read offline data:', e)
    return null
  }
}

// Note: Use Supabase's default storage (localStorage) to persist sessions across refreshes

// Create real client or fallback mock if env vars missing
let supabase

const missingEnv = !ENV_CONFIG.SUPABASE_URL || !ENV_CONFIG.SUPABASE_ANON_KEY

if (missingEnv) {
  // Hard error if missing envs (no silent fallback)
  const errMsg = 'Supabase configuration missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local file.'
  console.error(errMsg)
  
  // In dev, throw to make it obvious. In prod, use mock to avoid crashing
  if (import.meta.env.DEV) {
    throw new Error(errMsg)
  }
  
  console.warn('[supabase] Using mock client in production (this should not happen)')
  const mock = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Auth disabled (mock)' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Auth disabled (mock)' } }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null })
    })
  }
  supabase = mock
} else {
  // Log the actual URL being used (just domain for security)
  console.log(`[supabase] Connecting to: ${ENV_CONFIG.SUPABASE_URL.split('//')[1]?.split('.')[0]}`)
  
  try {
    supabase = createClient(ENV_CONFIG.SUPABASE_URL, ENV_CONFIG.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'implicit', // simpler for email/password; avoids PKCE redirects
      },
      global: {
        headers: {
          'x-app-name': ENV_CONFIG.APP_NAME
        },
        fetch: (input, init) => {
          // Add a timeout wrapper to avoid hanging requests after idle
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), 20000)
          return fetch(input, { ...(init || {}), signal: controller.signal })
            .finally(() => clearTimeout(id))
        }
      },
      realtime: {
        // Disable realtime as it can cause refresh issues
        params: {
          eventsPerSecond: 0
        }
      }
    })
    
  console.log('[supabase] Client initialized with persistent storage (localStorage)')
  } catch (error) {
    console.error('[supabase] Failed to initialize client:', error)
    // Provide a non-crashing fallback
    supabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Client initialization failed' } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Client initialization failed' } }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null })
      })
    }
  }
}

// Use singleton pattern to prevent multiple instances
export const getSupabaseClient = () => supabase
export { supabase }
export default supabase
