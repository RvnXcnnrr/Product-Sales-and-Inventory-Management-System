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

// Create real client or fallback mock if env vars missing
let supabase

const missingEnv = !ENV_CONFIG.SUPABASE_URL || !ENV_CONFIG.SUPABASE_ANON_KEY

if (missingEnv) {
  console.warn('[supabase] Missing env vars, using mock client')
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
  supabase = createClient(ENV_CONFIG.SUPABASE_URL, ENV_CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-app-name': ENV_CONFIG.APP_NAME
      }
    }
  })
}

export const getSupabaseClient = () => supabase
export { supabase }
export default supabase
