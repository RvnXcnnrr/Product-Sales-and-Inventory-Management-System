// Store settings API: load/save per store with Supabase, with local cache fallback
import supabase from './supabase'

const CACHE_KEY = (storeId) => `storeSettings:${storeId}`

export async function fetchStoreSettings(storeId) {
  if (!storeId) return { data: null, error: new Error('storeId required') }
  try {
    const { data: rows, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_id', storeId)
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      return { data: null, error }
    }

    const data = rows && rows[0]
    if (!data) {
      // If no row yet, try to read default currency/tax from stores
      const { data: storeRow } = await supabase
        .from('stores')
        .select('currency, tax_rate, timezone')
        .eq('id', storeId)
        .single()

      const defaults = {
        store_id: storeId,
        receipt_footer: 'Thank you for your purchase!',
        enable_email_receipts: true,
        date_format: 'MM/dd/yyyy',
        offline_mode: 'auto',
        auto_print_receipt: false,
        enable_cash: true,
        enable_card: true,
        enable_digital_wallet: false,
        notifications: {},
        ...(storeRow || {}),
      }
      // Cache and return defaults (caller may upsert later)
      localStorage.setItem(CACHE_KEY(storeId), JSON.stringify(defaults))
      return { data: defaults, error: null }
    }

    localStorage.setItem(CACHE_KEY(storeId), JSON.stringify(data))
  return { data, error: null }
  } catch (e) {
    // Fallback to cache
    const cached = localStorage.getItem(CACHE_KEY(storeId))
    return { data: cached ? JSON.parse(cached) : null, error: e }
  }
}

export async function saveStoreSettings(storeId, patch) {
  if (!storeId) return { data: null, error: new Error('storeId required') }
  const payload = { ...patch, store_id: storeId }
  // Upsert settings row
  const { data, error } = await supabase
    .from('store_settings')
    .upsert(payload, { onConflict: 'store_id' })
    .select()
    .single()

  if (!error && data) {
    localStorage.setItem(CACHE_KEY(storeId), JSON.stringify(data))
  }
  return { data, error }
}

// Utility to read cache only
export function getCachedStoreSettings(storeId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY(storeId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
