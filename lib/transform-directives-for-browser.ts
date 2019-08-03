import { CamelCaseDirectives as Directives, SourceListDirective } from './types';

function createFirefoxPreCSP10Directives (directives: Directives, basePolicy: any) {
  const result = Object.assign({}, basePolicy);

  // Copy `connectSrc` to `xhrSrc`
  const { connectSrc } = directives;
  if (connectSrc) {
    result.xhrSrc = connectSrc;
  }

  // Copy everything else
  Object.keys(directives).forEach((key) => {
    if (key !== 'connectSrc') {
      result[key] = directives[key as keyof Directives];
    }
  });

  // Rename `scriptSrc` values `unsafe-inline` and `unsafe-eval`
  const { scriptSrc } = directives;
  if (scriptSrc) {
    const optionsValues = [];

    if (scriptSrc.indexOf("'unsafe-inline'") !== -1) {
      optionsValues.push('inline-script');
    }
    if (scriptSrc.indexOf("'unsafe-eval'") !== -1) {
      optionsValues.push('eval-script');
    }

    if (optionsValues.length !== 0) {
      result.options = optionsValues;
    }
  }

  return result;
}

interface Handlers {
  [browser: string]: (platform: Platform, directives: Directives) => Directives;
}

// This is easier than converting `browser` to have non-undefined fields for now.
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const handlers: Handlers = {
  Firefox (browser, directives) {
    const version = parseFloat(browser.version!);

    if (version >= 4 && version < 23) {
      const basePolicy: { allow?: SourceListDirective; defaultSrc?: SourceListDirective } = {};
      if (version < 5) {
        basePolicy.allow = ['*'];

        if (directives.defaultSrc) {
          basePolicy.allow = directives.defaultSrc;
          delete directives.defaultSrc;
        }
      } else {
        basePolicy.defaultSrc = ['*'];
      }

      return createFirefoxPreCSP10Directives(directives, basePolicy);
    } else {
      return directives;
    }
  },

  'Firefox Mobile' (browser, directives) {
    // Handles both Firefox for Android and Firefox OS
    const { family } = browser.os!;
    const version = parseFloat(browser.version!);

    if (family === 'Firefox OS' && version < 32 || family === 'Android' && version < 25) {
      return createFirefoxPreCSP10Directives(directives, { defaultSrc: ['*'] });
    } else {
      return directives;
    }
  },
};

export = function transformDirectivesForBrowser (browser: Platform | undefined, directives: Directives) {
  if (!browser || !browser.name) {
    return directives;
  }

  const handler = handlers[browser.name];

  if (handler) {
    return handler(browser, directives);
  } else {
    return directives;
  }
}
