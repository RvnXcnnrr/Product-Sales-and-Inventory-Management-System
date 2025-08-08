// System settings management
import { useState, useEffect } from 'react';

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
  const [settings, setSettings] = useState(loadSettings);

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

  return {
    settings,
    updateSetting,
    updateSettings,
    resetSettings
  };
};

// Get current system settings without the hook (for non-component usage)
export const getSystemSettings = () => {
  return loadSettings();
};

export default useSystemSettings;
