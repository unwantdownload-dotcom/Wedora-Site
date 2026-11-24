/**
 * Formatting utilities for Wedora Order Management System
 * Currency: Sri Lankan Rupees (LKR / Rs.)
 */

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rs. 0.00';
  }
  const num = Number(amount);
  return `Rs. ${num.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-LK');
};

/**
 * Format Sri Lankan phone number for display
 * Example: +94783590222 -> +94 78 359 0222
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+94') && clean.length === 12) {
    return `+94 ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  if (clean.startsWith('0') && clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return phone;
};

/**
 * Build direct WhatsApp link with optional pre-filled message
 */
export const getWhatsAppUrl = (phone, message = '') => {
  if (!phone) return '#';
  // Strip non-digits except +
  let clean = phone.replace(/[^\d]/g, '');
  // If starts with 0 (e.g. 077...), replace with 94
  if (clean.startsWith('0')) {
    clean = '94' + clean.slice(1);
  }
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${clean}${message ? `?text=${encodedMsg}` : ''}`;
};

/**
 * Truncate long text with ellipsis
 */
export const truncateText = (text, maxLength = 35) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Sri Lanka Post (SLP) Tracking helpers
 */
export const SLP_TRACKING_URL = 'http://slpmail.slpost.gov.lk/track/index.php';

export const copyTrackingAndOpenSlp = async (barcode) => {
  if (barcode) {
    try {
      await navigator.clipboard.writeText(barcode.trim());
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  }
  window.open(SLP_TRACKING_URL, '_blank');
};
