import isFunction from './is-function';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export = function containsFunction (obj: { [key: string]: any }) {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    let value = obj[key];

    if (!Array.isArray(value)) {
      value = [value];
    }

    if (value.some(isFunction)) {
      return true;
    }
  }

  return false;
}
