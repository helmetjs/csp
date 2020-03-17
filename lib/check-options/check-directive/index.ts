import config from '../../config';

import boolean from './boolean';
import pluginTypes from './plugin-types';
import reportUri from './report-uri';
import requireSriFor from './require-sri-for';
import sandbox from './sandbox';
import sourceList from './source-list';

import { CspOptions } from '../../types';

interface Checkers {
  [directiveType: string]: (key: string, value: unknown) => void;
}

const checkers: Checkers = {
  boolean,
  pluginTypes,
  reportUri,
  requireSriFor,
  sandbox,
  sourceList,
};

export = function checkDirective (key: string, value: unknown, options: CspOptions) {
  if (options.loose) { return; }

  if (!Object.prototype.hasOwnProperty.call(config.directives, key)) {
    throw new Error(`"${key}" is an invalid directive. See the documentation for the supported list. Force this by enabling loose mode.`);
  }

  // This cast is safe thanks to the above check.
  const directiveType = config.directives[key as keyof typeof config.directives].type;
  checkers[directiveType](key, value);
};
