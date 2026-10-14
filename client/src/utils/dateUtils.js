export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats a timestamp into Indian Standard Time (IST) 12-hour format (e.g., "11:54 PM")
 * @param {Date|string|number} dateInput 
 * @param {boolean} includeSeconds 
 * @returns {string} Formatted IST time string
 */
export const formatIndianTime = (dateInput, includeSeconds = false) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: true,
  });
};

/**
 * Formats a timestamp into Indian date format (e.g., "14 Oct 2026")
 * @param {Date|string|number} dateInput 
 * @returns {string} Formatted date string
 */
export const formatIndianDate = (dateInput) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a timestamp into combined Indian Date & Time (e.g., "14 Oct 2026, 11:54 PM")
 * @param {Date|string|number} dateInput 
 * @param {boolean} includeSeconds 
 * @returns {string} Formatted date & time string
 */
export const formatIndianDateTime = (dateInput, includeSeconds = false) => {
  if (!dateInput) return '-';
  return `${formatIndianDate(dateInput)} • ${formatIndianTime(dateInput, includeSeconds)}`;
};
