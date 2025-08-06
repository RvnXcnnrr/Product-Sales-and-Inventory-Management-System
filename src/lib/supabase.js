import { createClient } from '@supabase/supabase-js'

console.log('Supabase module loaded')

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://piyehrqkuzckfkewtvpy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeWVocnFrdXpja2ZrZXd0dnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDAxMjYsImV4cCI6MjA3MDA3NjEyNn0.qnMvwUBGVhlJ6oI0cNob7iKn5X6H2iPbr0YGimGHOEk'

console.log('Environment check:', {
  url: supabaseUrl ? '✅ Present' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Present' : '❌ Missing',
  env: import.meta.env.NODE_ENV || 'development',
  actualUrl: supabaseUrl,
  fromEnv: import.meta.env.VITE_SUPABASE_URL
})

// Check if URL is valid
const isValidSupabaseUrl = (url) => {
  // Enable real client to test actual URL
  console.log('� Testing with real Supabase client, URL:', url)
  return url && url.includes('.supabase.co') && url.startsWith('https://')
}

// Create the Supabase client
let supabase

try {
  if (isValidSupabaseUrl(supabaseUrl)) {
    console.log('🔗 Using real Supabase client')
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  } else {
    throw new Error('Invalid Supabase URL, using mock client')
  }
} catch (error) {
  console.log('🚧 Using mock Supabase client:', error.message)
  // Create a mock client for development
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback) => {
        setTimeout(() => callback('INITIAL_SESSION', null), 100)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signInWithPassword: async ({ email, password }) => {
        console.log('🧪 Mock signIn:', { email })
        const mockUser = {
          id: 'mock-user-id',
          email,
          user_metadata: { full_name: 'Mock User' }
        }
        const mockSession = {
          user: mockUser,
          access_token: 'mock-token'
        }
        return { data: { user: mockUser, session: mockSession }, error: null }
      },
      signUp: async ({ email, password, options }) => {
        console.log('🧪 Mock signUp:', { email, userData: options?.data })
        const mockUser = {
          id: 'mock-user-id-' + Date.now(),
          email,
          user_metadata: options?.data || {}
        }
        return { 
          data: { 
            user: mockUser, 
            session: null
          }, 
          error: null 
        }
      },
      signOut: () => {
        console.log('🧪 Mock signOut')
        return Promise.resolve({ error: null })
      },
    },
    from: (table) => ({
      select: (query) => Promise.resolve({ data: [], error: null }),
      insert: (data) => Promise.resolve({ data: [data], error: null }),
      update: (data) => Promise.resolve({ data: [data], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: function(column, value) { return this },
      single: function() { return this }
    })
  }
}

console.log('✅ Supabase client created successfully')

// Mock functions for offline data
export const setOfflineData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

export const getOfflineData = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.warn('Failed to get from localStorage:', e)
    return null
  }
}

// Database table names
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

// Export the supabase client
export { supabase }
export default supabase
export const getSupabaseClient = () => supabase
