import { IncomingMessage, ServerResponse } from 'http';

import isFunction from './is-function';
import { Directives, ParsedDirectives } from './types';

export = function parseDynamicDirectives (directives: Directives, functionArgs: [IncomingMessage, ServerResponse]) {
  const result: ParsedDirectives = {};

  Object.keys(directives).forEach((key) => {
    const typedKey = key as keyof ParsedDirectives;
    const value = directives[typedKey];

    if (Array.isArray(value)) {
      result[typedKey] = value.map((element) => {
        if (isFunction(element)) {
          return element.apply(null, functionArgs);
        } else {
          return element;
        }
      });
    } else if (isFunction(value)) {
      result[typedKey] = value.apply(null, functionArgs);
    } else if (value !== false) {
      result[typedKey] = value;
    }
  });

  return result;
}
