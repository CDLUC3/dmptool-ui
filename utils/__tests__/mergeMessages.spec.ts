import { mergeMessages } from '../mergeMessages';

describe('mergeMessages', () => {
  it('uses the override value when both have the same key', () => {
    expect(mergeMessages({ title: 'Hello' }, { title: 'Olá' })).toEqual({ title: 'Olá' });
  });

  it('falls back to the fallback value for keys missing from the overrides', () => {
    const fallback = { Global: { buttons: { save: 'Save', cancel: 'Cancel' } } };
    const overrides = { Global: { buttons: { save: 'Salvar' } } };

    expect(mergeMessages(fallback, overrides)).toEqual({
      Global: { buttons: { save: 'Salvar', cancel: 'Cancel' } },
    });
  });

  it('keeps keys that only exist in the overrides', () => {
    expect(mergeMessages({ a: 'A' }, { b: 'B' })).toEqual({ a: 'A', b: 'B' });
  });

  it('replaces arrays instead of concatenating them', () => {
    const fallback = { list: ['one', 'two', 'three'] };
    const overrides = { list: ['um', 'dois', 'três'] };

    expect(mergeMessages(fallback, overrides)).toEqual({ list: ['um', 'dois', 'três'] });
  });

  it('replaces an object with a non-object override value', () => {
    expect(mergeMessages({ a: { b: 'B' } }, { a: 'A' })).toEqual({ a: 'A' });
  });

  it('does not modify the inputs', () => {
    const fallback = { nested: { a: 'A' } };
    const overrides = { nested: { b: 'B' } };

    mergeMessages(fallback, overrides);

    expect(fallback).toEqual({ nested: { a: 'A' } });
    expect(overrides).toEqual({ nested: { b: 'B' } });
  });

  it('ignores __proto__, constructor and prototype keys', () => {
    const overrides = JSON.parse(
      '{"__proto__": {"polluted": "yes"}, "constructor": {"prototype": {"polluted": "yes"}}, "prototype": "x", "ok": "fine"}'
    );

    const result = mergeMessages({}, overrides);

    expect(result).toEqual({ ok: 'fine' });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    const plainObject: Record<string, unknown> = {};

    expect(result.polluted).toBeUndefined();
    expect(plainObject.polluted).toBeUndefined();
  });
});
