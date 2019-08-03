import isString from '../../lib/is-string';

describe('isString', () => {
  it('returns true for strings', () => {
    expect(isString('')).toBe(true);
    expect(isString('hello world')).toBe(true);
    expect(isString(new String(''))).toBe(true); // eslint-disable-line no-new-wrappers
    expect(isString(new String('hi hi'))).toBe(true); // eslint-disable-line no-new-wrappers
  });

  it('returns false for non-strings', () => {
    expect(!isString()).toBe(false);
    expect(!isString(() => {})).toBe(false);
    expect(!isString(true)).toBe(false);
    expect(!isString(false)).toBe(false);
    expect(!isString(null)).toBe(false);
    expect(!isString(0)).toBe(false);
    expect(!isString(123)).toBe(false);
    expect(!isString([])).toBe(false);
    expect(!isString({})).toBe(false);
  });
});
