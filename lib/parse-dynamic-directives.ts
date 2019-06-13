import isFunction from './is-function';

export = function parseDynamicDirectives (directives, functionArgs) {
  const result: {[directive: string]: any} = {};

  Object.keys(directives).forEach((key) => {
    const value = directives[key];

    if (Array.isArray(value)) {
      result[key] = value.map((element) => {
        if (isFunction(element)) {
          return element.apply(null, functionArgs);
        } else {
          return element;
        }
      });
    } else if (isFunction(value)) {
      result[key] = value.apply(null, functionArgs);
    } else if (value !== false) {
      result[key] = value;
    }
  });

  return result;
}
