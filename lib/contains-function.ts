import isFunction from './is-function';

export = function containsFunction (obj: object) {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    let value = (obj as any)[key];

    if (!Array.isArray(value)) {
      value = [value];
    }

    if (value.some(isFunction)) {
      return true;
    }
  }

  return false;
}
