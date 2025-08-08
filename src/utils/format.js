// Currency formatting utilities
import { getSystemSettings } from './systemSettings';

/**
 * Format a number as currency with proper symbol based on currency code
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (USD, EUR, PHP, etc.) - if not provided, uses system setting
 * @param {string} locale - Locale for formatting (defaults to 'en-US')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = null, locale = 'en-US') => {
  if (amount === null || amount === undefined) return '';
  
  // If no currency code provided, use the system settings
  if (!currencyCode) {
    const systemSettings = getSystemSettings();
    currencyCode = systemSettings.currency || 'USD';
  }
  
  // Handle special cases for currencies that might not format well with Intl
  if (currencyCode === 'PHP') {
    // Format with PHP peso sign (₱)
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'PHP',
        currencyDisplay: 'narrowSymbol',
      }).format(amount);
    } catch (e) {
      // Fallback if the formatter doesn't support PHP properly
      return `₱${parseFloat(amount).toFixed(2)}`;
    }
  }
  
  // Use Intl.NumberFormat for standard formatting
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
    }).format(amount);
  } catch (e) {
    console.warn(`Error formatting currency ${currencyCode}:`, e);
    // Fallback to basic formatting if Intl fails
    return `${currencyCode} ${parseFloat(amount).toFixed(2)}`;
  }
};

/**
 * Get currency symbol for a given currency code
 * @param {string} currencyCode - Currency code (USD, EUR, PHP, etc.)
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode = 'USD') => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PHP: '₱',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    // Add more currencies as needed
  };
  
  return symbols[currencyCode] || currencyCode;
};

export default formatCurrency;
