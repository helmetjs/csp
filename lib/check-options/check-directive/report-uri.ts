import isFunction from '../../is-function';
import isString from '../../is-string';

export = function (key: string, value: unknown) {
  if (value === false) { return; }
  if (isFunction(value)) { return; }

  if (!isString(value) || value.length === 0) {
    throw new Error(`"${value}" is not a valid value for ${key}. Use a non-empty string.`);
  }
};
