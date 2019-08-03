import isFunction from '../../lib/is-function';

describe('isFunction', () => {
  it('returns true for normal functions', () => {
    function foo () {}

    expect(isFunction(foo)).toBe(true);
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(new Function('return 5'))).toBe(true); // eslint-disable-line no-new-func
  });

  it('returns false for non-functions', () => {
    expect(!isFunction()).toBe(false);
    expect(!isFunction('')).toBe(false);
    expect(!isFunction(true)).toBe(false);
    expect(!isFunction(false)).toBe(false);
    expect(!isFunction(null)).toBe(false);
    expect(!isFunction('function () {}')).toBe(false);
    expect(!isFunction([])).toBe(false);
    expect(!isFunction([function () {}])).toBe(false);
    expect(!isFunction({})).toBe(false);
  });
});
