// System settings management
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import supabase from '../lib/supabase';
import { fetchStoreSettings, saveStoreSettings, getCachedStoreSettings } from '../lib/storeSettings';

// Default settings
const defaultSettings = {
  currency: 'PHP', // Default to PHP as requested
  taxRate: 0.1, // 10% default tax
  timezone: 'Asia/Manila', // Default timezone
  receiptFooter: 'Thank you for your purchase!',
  dateFormat: 'MM/dd/yyyy',
  enableEmailReceipts: true,
  offlineMode: 'auto',
};

// Load settings from localStorage
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('systemSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
};

// Save settings to localStorage
const saveSettings = (settings) => {
  try {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

// Hook to use system settings
export const useSystemSettings = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState(loadSettings);
  const [loading, setLoading] = useState(false);
  const storeId = profile?.store_id || null;

  // Hydrate from Supabase when storeId is available
  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      if (!storeId) return;
      setLoading(true);
      try {
        const cached = getCachedStoreSettings(storeId);
        if (cached) {
          // Merge cache into current settings quickly
          if (!isMounted) return;
          setSettings(prev => ({ ...prev, ...cached, currency: cached.currency || prev.currency, taxRate: cached.tax_rate ?? prev.taxRate, timezone: cached.timezone || prev.timezone, receiptFooter: cached.receipt_footer ?? prev.receiptFooter, enableEmailReceipts: cached.enable_email_receipts ?? prev.enableEmailReceipts }));
        }
        const { data, error } = await fetchStoreSettings(storeId);
        if (!isMounted) return;
        if (!error && data) {
          // 'stores' table carries base currency/tax/timezone; store_settings carries extended fields
          setSettings(prev => ({
            ...prev,
            currency: data.currency || prev.currency,
            taxRate: (data.tax_rate != null) ? Number(data.tax_rate) : prev.taxRate,
            timezone: data.timezone || prev.timezone,
            receiptFooter: data.receipt_footer ?? prev.receiptFooter,
            enableEmailReceipts: data.enable_email_receipts ?? prev.enableEmailReceipts,
            dateFormat: data.date_format || prev.dateFormat,
            offlineMode: data.offline_mode || prev.offlineMode,
            autoPrintReceipt: data.auto_print_receipt ?? prev.autoPrintReceipt,
            payment: {
              enableCash: data.enable_cash ?? true,
              enableCard: data.enable_card ?? true,
              enableDigitalWallet: data.enable_digital_wallet ?? false,
            },
            notifications: data.notifications || {},
          }));
        }

        // Also load store profile fields (name, code, contact)
        const { data: storeMeta, error: storeMetaErr } = await supabase
          .from('stores')
          .select('name, code, email, phone, address')
          .eq('id', storeId)
          .single();
        if (!isMounted) return;
        if (!storeMetaErr && storeMeta) {
          setSettings(prev => ({
            ...prev,
            storeName: storeMeta.name || prev.storeName,
            storeCode: storeMeta.code || prev.storeCode,
            email: storeMeta.email || prev.email,
            phone: storeMeta.phone || prev.phone,
            address: storeMeta.address || prev.address,
          }));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    hydrate();
    return () => { isMounted = false };
  }, [storeId]);

  // Persist to localStorage whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Update a specific setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Update multiple settings at once
  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // Reset all settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  // Save settings to Supabase (per-store) and keep local in sync
  const saveAll = async () => {
    if (!storeId) return { error: new Error('No store selected') };
    // Split base settings (stores) and extended (store_settings)
    const base = {
      currency: settings.currency,
      tax_rate: settings.taxRate,
      timezone: settings.timezone,
    };
    const extended = {
      receipt_footer: settings.receiptFooter,
      enable_email_receipts: settings.enableEmailReceipts,
      date_format: settings.dateFormat,
      offline_mode: settings.offlineMode,
      auto_print_receipt: settings.autoPrintReceipt || false,
      enable_cash: settings.payment?.enableCash ?? true,
      enable_card: settings.payment?.enableCard ?? true,
      enable_digital_wallet: settings.payment?.enableDigitalWallet ?? false,
      notifications: settings.notifications || {},
    };

    // Update base store fields
    const { error: storeErr } = await supabase
      .from('stores')
      .update(base)
      .eq('id', storeId);
    if (storeErr) return { error: storeErr };

    // Upsert extended settings
    const { error: extErr } = await saveStoreSettings(storeId, extended);
    if (extErr) return { error: extErr };
    return { error: null };
  };

  return {
    settings,
    loading,
    updateSetting,
    updateSettings,
    resetSettings,
    saveAll
  };
};

// Get current system settings without the hook (for non-component usage)
export const getSystemSettings = () => {
  return loadSettings();
};

export default useSystemSettings;
