import isBoolean from '../../lib/is-boolean';

describe('isBoolean', () => {
  it('returns true for booleans', () => {
    expect(isBoolean(true)).toEqual(true);
    expect(isBoolean(false)).toEqual(true);
    expect(isBoolean(new Boolean(true))).toEqual(true); // eslint-disable-line no-new-wrappers
    expect(isBoolean(new Boolean(false))).toEqual(true); // eslint-disable-line no-new-wrappers
  });

  it('returns false for non-booleans', () => {
    expect(!isBoolean()).toBe(false);
    expect(!isBoolean(() => {})).toBe(false);
    expect(!isBoolean('')).toBe(false);
    expect(!isBoolean('true')).toBe(false);
    expect(!isBoolean('false')).toBe(false);
    expect(!isBoolean(null)).toBe(false);
    expect(!isBoolean(0)).toBe(false);
    expect(!isBoolean(123)).toBe(false);
    expect(!isBoolean([])).toBe(false);
    expect(!isBoolean({})).toBe(false);
  });
});
