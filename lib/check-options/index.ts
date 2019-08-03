import dasherize from 'dasherize';

import checkDirective from './check-directive';
import { CSPOptions, AllDirectives } from '../types';

function isObject (value: unknown): value is object {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export = function (options: CSPOptions) {
  if (!isObject(options)) {
    throw new Error('csp must be called with an object argument. See the documentation.');
  }

  const { directives } = options;

  if (!isObject(directives) || Object.keys(directives).length === 0) {
    throw new Error('csp must have at least one directive under the "directives" key. See the documentation.');
  }

  Object.keys(directives).forEach((directiveKey) => {
    const typedKey = directiveKey as keyof AllDirectives;
    checkDirective(dasherize(directiveKey), directives[typedKey], options);
  });
};
