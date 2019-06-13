import isFunction from './is-function';

// TODO: Type this `obj`.
export = function containsFunction (obj: any) {
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
