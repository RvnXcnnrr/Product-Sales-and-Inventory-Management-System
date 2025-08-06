// Environment variables fallback for development
export const ENV_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://piyehrqkuzckfkewtvy.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeWVocnFrdXpja2ZrZXd0dnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDAxMjYsImV4cCI6MjA3MDA3NjEyNn0.qnMvwUBGVhlJ6oI0cNob7iKn5X6H2iPbr0YGimGHOEk',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'POS & Inventory Management',
  DEV_MODE: import.meta.env.VITE_DEV_MODE !== 'false'
}

// Debug log in development
if (import.meta.env.DEV) {
  console.log('Environment Configuration:', {
    url: ENV_CONFIG.SUPABASE_URL ? '✅ Present' : '❌ Missing',
    key: ENV_CONFIG.SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
    mode: import.meta.env.NODE_ENV || 'development'
  })
}
