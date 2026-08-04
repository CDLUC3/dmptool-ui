import { getOverrides, isOptionsType } from '../hooks/useEditQuestion';
import { OPTIONS_QUESTION_TYPES } from '@/lib/constants';

describe('getOverrides', () => {
  it('returns maxLength: null for "text"', () => {
    expect(getOverrides('text')).toEqual({ maxLength: null });
  });

  it('returns maxLength: null and rows: 20 for "textArea"', () => {
    expect(getOverrides('textArea')).toEqual({ maxLength: null, rows: 20 });
  });

  it('returns min, max, and step for "number"', () => {
    expect(getOverrides('number')).toEqual({ min: 0, max: 10000000, step: 1 });
  });

  it('returns maxLength, minLength, and pattern for "url"', () => {
    expect(getOverrides('url')).toEqual({
      maxLength: 2048,
      minLength: 2,
      pattern: 'https?://.+',
    });
  });

  it('returns an empty object for an unrecognized question type', () => {
    expect(getOverrides('radioButtons')).toEqual({});
    expect(getOverrides('someRandomType')).toEqual({});
  });

  it('returns an empty object for null', () => {
    expect(getOverrides(null)).toEqual({});
  });

  it('returns an empty object for undefined', () => {
    expect(getOverrides(undefined)).toEqual({});
  });

  it('returns an empty object for an empty string', () => {
    expect(getOverrides('')).toEqual({});
  });
});

describe('isOptionsType', () => {
  it.each(OPTIONS_QUESTION_TYPES)('returns true for "%s"', (type) => {
    expect(isOptionsType(type)).toBe(true);
  });

  it('returns false for a non-options question type', () => {
    expect(isOptionsType('text')).toBe(false);
    expect(isOptionsType('textArea')).toBe(false);
    expect(isOptionsType('number')).toBe(false);
    expect(isOptionsType('url')).toBe(false);
  });

  it('returns false for an unrecognized string', () => {
    expect(isOptionsType('notAQuestionType')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isOptionsType('')).toBe(false);
  });
});