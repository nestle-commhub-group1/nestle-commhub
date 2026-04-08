/**
 * dateUtils.js
 *
 * Utility functions for formatting and comparing dates throughout the application.
 *
 * When to use each function:
 * - formatDate        → Show a clean date on tickets and cards (e.g., "Mar 15, 2026")
 * - formatDateTime    → Show a date AND time in notifications or chat messages (e.g., "Mar 15, 10:23 AM")
 * - formatTimeAgo     → Show how long ago something happened, for a conversational feel (e.g., "3 hours ago")
 * - getCurrentGreeting → Personalised dashboard greeting based on time of day
 * - formatCurrentDate → Full human-readable date for dashboard headers
 */

/**
 * Returns true if the given date is today.
 * Useful for highlighting tickets submitted today vs. older ones.
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isToday = (date) => {
  const d     = new Date(date);
  const today = new Date();
  return (
    d.getDate()     === today.getDate() &&
    d.getMonth()    === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Formats a date to "MMM DD, YYYY" — e.g., "Oct 12, 2023".
 * Use this when you need just the date, not the time (e.g., ticket cards).
 * Returns "—" for null/undefined inputs to avoid displaying "Invalid Date".
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric'
  });
};

/**
 * Returns a relative "time ago" string — e.g., "3 hours ago", "2 days ago".
 * Use this in notification feeds or chat timestamps for a natural, conversational feel.
 * Returns "—" for null/undefined inputs.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTimeAgo = (date) => {
  if (!date) return '—';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  // Check each time unit from largest to smallest and return the first match
  let interval = seconds / 31536000; // seconds in a year
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000; // seconds in a month
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400; // seconds in a day
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600; // seconds in an hour
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60; // seconds in a minute
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return Math.floor(seconds) + " seconds ago"; // Less than a minute ago
};

/**
 * Formats a date to "MMM DD, HH:mm AM/PM" — e.g., "Mar 15, 10:23 AM".
 * Use this when you need both the date and time (e.g., SLA deadlines, chat messages).
 * Returns "—" for null/undefined inputs.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month:  'short',
    day:    'numeric',
    hour:   'numeric',
    minute: '2-digit',
    hour12: true // Use AM/PM format
  });
};

/**
 * Returns a greeting based on the current hour of the day.
 * Used on dashboards to give a personalised, friendly welcome.
 * - Before 12:00 → "Good morning"
 * - 12:00–16:59  → "Good afternoon"
 * - 17:00+       → "Good evening"
 */
export const getCurrentGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

/**
 * Formats today's date as a full human-readable string — e.g., "Wednesday, March 20, 2026".
 * Used in dashboard headers to orient the user to the current date.
 */
export const formatCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    year:    'numeric'
  });
};
