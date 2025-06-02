/**
 * Format a number as currency
 * @param {number} value - The number to format
 * @param {string} currency - The currency code (default: INR)
 * @param {string} locale - The locale (default: en-IN)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'INR', locale = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a number with thousands separators
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @param {string} locale - The locale (default: en-IN)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0, locale = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a date
 * @param {string|Date} date - The date to format
 * @param {string} format - The format (short, medium, long, full, or custom)
 * @param {string} locale - The locale (default: en-US)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium', locale = 'en-US') => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  switch (format) {
    case 'day':
      return dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    case 'week':
      return `Week of ${dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`;
    case 'month':
      return dateObj.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    case 'year':
      return dateObj.getFullYear().toString();
    case 'short':
      return dateObj.toLocaleDateString(locale, { month: 'numeric', day: 'numeric', year: '2-digit' });
    case 'medium':
      return dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return dateObj.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
    case 'full':
      return dateObj.toLocaleDateString(locale, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    case 'time':
      return dateObj.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    case 'datetime':
      return `${dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} at ${dateObj.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`;
    case 'relative':
      return formatRelativeTime(dateObj);
    default:
      return dateObj.toLocaleDateString(locale);
  }
};

/**
 * Format a date as a relative time (e.g., "2 days ago")
 * @param {Date} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

/**
 * Format a percentage
 * @param {number} value - The number to format as percentage
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Truncate text to a specified length and add ellipsis
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length (default: 50)
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text || text.length <= length) {
    return text;
  }
  return `${text.substring(0, length - 3)}...`;
};

/**
 * Format a number as file size (bytes, KB, MB, etc.)
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}; 