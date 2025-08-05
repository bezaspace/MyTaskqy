// Universal IST Time Utility
// Uses date-fns-tz for robust timezone handling
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get the current date/time in IST as a Date object
 */
export function getCurrentISTDate(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

/**
 * Format a date in IST using a date-fns format string
 */
export function formatIST(date: Date | string | number, formatStr: string): string {
  return formatInTimeZone(date, IST_TIMEZONE, formatStr);
}

/**
 * Convert a UTC/ISO date to IST Date object
 */
export function toIST(date: Date | string | number): Date {
  return toZonedTime(date, IST_TIMEZONE);
}

/**
 * Convert a local IST date to UTC Date object
 */
export function fromIST(date: Date | string | number): Date {
  return fromZonedTime(date, IST_TIMEZONE);
}

/**
 * Parse a date string as IST (returns a Date in UTC)
 */
export function parseIST(dateString: string): Date {
  // This assumes the input is in 'yyyy-MM-dd HH:mm:ss' or similar format
  // and should be interpreted as IST
  return fromZonedTime(dateString, IST_TIMEZONE);
}

export { IST_TIMEZONE };
