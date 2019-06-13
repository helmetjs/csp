import config from '../../config';

import boolean from './boolean';
import pluginTypes from './plugin-types';
import reportUri from './report-uri';
import requireSriFor from './require-sri-for';
import sandbox from './sandbox';
import sourceList from './source-list';

const checkers = {
  boolean,
  pluginTypes,
  reportUri,
  requireSriFor,
  sandbox,
  sourceList,
};

// TODO: Type `options`.
export = function (key: string, value: unknown, options: any) {
  if (options.loose) { return; }

  if (!Object.prototype.hasOwnProperty.call(config.directives, key)) {
    throw new Error(`"${key}" is an invalid directive. See the documentation for the supported list. Force this by enabling loose mode.`);
  }

  const directiveType = config.directives[key].type;
  checkers[directiveType](key, value, options);
};
