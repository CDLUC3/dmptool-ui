// Run as if the browser is in California, so a timestamp read as local time instead of UTC shows the wrong time
process.env.TZ = 'America/Los_Angeles';

import { formatToDateOnly, formatWithTimeAndDate, parseTimestamp } from '@/utils/dateUtils';

// Stands in for next-intl's format.dateTime, showing times in UTC so the expected values don't depend on the machine
const formatter = ((value: Date | number, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(value)
) as Parameters<typeof formatWithTimeAndDate>[1];

describe('parseTimestamp', () => {
  it('reads a millisecond timestamp', () => {
    expect(parseTimestamp('1793903121000').toISOString()).toBe('2026-11-05T18:25:21.000Z');
  });

  it('reads a date and time with no time zone as UTC', () => {
    expect(parseTimestamp('2026-11-05 18:25:21').toISOString()).toBe('2026-11-05T18:25:21.000Z');
    expect(parseTimestamp('2026-11-05T18:25').toISOString()).toBe('2026-11-05T18:25:00.000Z');
  });

  it('keeps the time zone of a timestamp that has one', () => {
    expect(parseTimestamp('2026-11-05T18:25:21-08:00').toISOString()).toBe('2026-11-06T02:25:21.000Z');
    expect(parseTimestamp('2026-11-05T18:25:21Z').toISOString()).toBe('2026-11-05T18:25:21.000Z');
  });
});

describe('formatWithTimeAndDate', () => {
  it('shows a timestamp with no time zone at its UTC time', () => {
    // The API sends template version dates like this, in UTC
    expect(formatWithTimeAndDate('2026-11-05 18:25:21', formatter)).toBe('Nov 5, 2026, 6:25 PM');
  });

  it('shows a millisecond timestamp', () => {
    expect(formatWithTimeAndDate('1793903121000', formatter)).toBe('Nov 5, 2026, 6:25 PM');
  });

  it('returns "No date" for an empty timestamp', () => {
    expect(formatWithTimeAndDate('', formatter)).toBe('No date');
  });
});

describe('formatToDateOnly', () => {
  it('shows a timestamp with no time zone on its UTC date', () => {
    // 8 PM UTC is still November 5th; read as local time in California it would be the 6th
    expect(formatToDateOnly('2026-11-05 20:00:00', formatter)).toBe('11-05-2026');
  });

  it('returns "No date" for an empty timestamp', () => {
    expect(formatToDateOnly('', formatter)).toBe('No date');
  });
});
