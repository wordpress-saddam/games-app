import i18n from '../i18n';

/**
 * Converts English digits (0-9) to Arabic-Indic digits (٠-٩) for display purposes only.
 * This is a UI-only conversion and does not affect data storage or calculations.
 * 
 * @param value - The number or string to convert
 * @returns String with Arabic digits if language is Arabic, otherwise returns original format
 */
export const formatNumberForDisplay = (value: number | string): string => {
  const currentLang = i18n.language || 'en';
  
  // If not Arabic, return as-is
  if (currentLang !== 'ar') {
    return String(value);
  }
  
  // Convert to string first
  const str = String(value);
  
  // Map English digits to Arabic-Indic digits
  const digitMap: { [key: string]: string } = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩',
  };
  
  // Replace each English digit with Arabic digit
  return str.replace(/\d/g, (digit) => digitMap[digit] || digit);
};

/**
 * Formats a number with locale-specific formatting (thousands separators, decimals)
 * and converts digits to Arabic if needed.
 * 
 * @param value - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted string with appropriate digits
 */
export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions
): string => {
  const currentLang = i18n.language || 'en';
  
  // Format the number with locale-specific formatting
  const formatted = new Intl.NumberFormat(
    currentLang === 'ar' ? 'ar-SA' : 'en-US',
    options
  ).format(value);
  
  // If Arabic, convert digits
  if (currentLang === 'ar') {
    return formatNumberForDisplay(formatted);
  }
  
  return formatted;
};

/**
 * Formats time (seconds) to MM:SS format with Arabic digits if needed
 * 
 * @param seconds - Total seconds
 * @returns Formatted time string (MM:SS)
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');
  
  return formatNumberForDisplay(`${minsStr}:${secsStr}`);
};

export const formatedTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');
  
  return formatNumberForDisplay(`${minsStr}:${secsStr}`);
};

/**
 * Formats time with hours, minutes, and seconds (e.g., "1h : 2m : 3s")
 * 
 * @param totalSeconds - Total seconds
 * @returns Formatted time string
 */
export const formatTimeWithHours = (totalSeconds: number): string => {
  const sec = totalSeconds % 60;
  const min = Math.floor((totalSeconds / 60) % 60);
  const hr = Math.floor(totalSeconds / 3600);

  let result = '';
  if (hr > 0) result += `${formatNumberForDisplay(hr)}h : `;
  if (min > 0 || hr > 0) result += `${formatNumberForDisplay(min)}m : `;
  result += `${formatNumberForDisplay(sec)}s`;

  return result;
};

