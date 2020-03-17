import isFunction from './is-function';

export = function containsFunction (obj: { [key: string]: unknown }) {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    const value = obj[key];
    if (Array.isArray(value) && value.some(isFunction) || isFunction(value)) {
      return true;
    }
  }

  return false;
}
