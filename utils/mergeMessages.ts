type Messages = Record<string, unknown>;

// Keys that could modify Object.prototype if copied onto a plain object
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isPlainObject = (value: unknown): value is Messages =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Deep merges locale messages over fallback messages.
 * Nested objects are merged, so keys missing from the locale fall back to the fallback messages.
 * Arrays and other values from the locale replace the fallback value, so translated lists are not
 * appended to the fallback lists.
 */
export const mergeMessages = (fallback: Messages, overrides: Messages): Messages => {
  const result: Messages = { ...fallback };

  for (const key of Object.keys(overrides)) {
    if (UNSAFE_KEYS.has(key)) continue;

    const fallbackValue = result[key];
    const overrideValue = overrides[key];

    result[key] = isPlainObject(fallbackValue) && isPlainObject(overrideValue)
      ? mergeMessages(fallbackValue, overrideValue)
      : overrideValue;
  }

  return result;
};
