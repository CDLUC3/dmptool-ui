import {
  DateValue,
  parseDate,
} from "@internationalized/date";
import logECS from '@/utils/clientLogger';
import type { DateTimeFormatOptions } from 'use-intl';

type DateTimeFormatterFn = {
  (value: number | Date, options?: DateTimeFormatOptions): string;
  (value: Date | number, format?: string, options?: DateTimeFormatOptions): string;
};


// A date and time with no time zone, like "2025-09-24 17:10:11"
const ZONELESS_DATE_TIME = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

// Parse a timestamp from the API: milliseconds ("1758733811000"), a date and time with no time zone
// ("2025-09-24 17:10:11"), or any other string Date understands (e.g. ISO with a time zone).
// The API sends date-times with no time zone in UTC, but `new Date()` reads them as local time, which
// shifts them by the browser's UTC offset. So read them as UTC.
export const parseTimestamp = (timestamp: string): Date => {
  if (/^\d+$/.test(timestamp)) {
    return new Date(parseInt(timestamp));
  }
  if (ZONELESS_DATE_TIME.test(timestamp)) {
    return new Date(`${timestamp.replace(' ', 'T')}Z`);
  }
  return new Date(timestamp);
};

// Format timestamp with time and date using next-intl formatter
export const formatWithTimeAndDate = (
  timestamp: string,
  formatter: DateTimeFormatterFn
): string => {
  if (!timestamp) return 'No date';

  try {
    const date = parseTimestamp(timestamp);

    // Use the formatter with options for time and date
    return formatter(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    logECS('error', 'Error in formatWithTimeAndDate', { error });
    return 'Invalid date';
  }
};

// Helper function to safely get a CalendarDate value
export const getCalendarDateValue = (dateValue: DateValue | string | null) => {
  if (!dateValue) return null;
  return typeof dateValue === 'string' ? parseDate(dateValue) : dateValue;
};


// Convert Timestamp into relative time - like "2 days ago"
export const formatRelativeFromTimestamp = (timestampMs: string, locale: string) => {
  const now = Date.now();
  const diffMs = Number(timestampMs) - now;

  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHrs = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHrs / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, "day");
  if (Math.abs(diffHrs) >= 1) return rtf.format(diffHrs, "hour");
  if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, "minute");

  return rtf.format(diffSec, "second");
}

// Format date string like "2025-09-24 17:10:11" to "09-24-2025" with dashes
export const formatToDateOnly = (
  dateString: string,
  formatter: DateTimeFormatterFn
): string => {
  if (!dateString) return 'No date';

  try {
    const date = parseTimestamp(dateString);

    // Get the formatted parts from the formatter
    const formatted = formatter(date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Replace slashes or other separators with dashes
    // This udpates the default use of slashes "09/24/2025" to "09-24-2025"
    return formatted.replace(/[\/\.]/g, '-');
  } catch (error) {
    logECS('error', 'Error in formatToDateOnly', { error });
    return 'Invalid date';
  }
};