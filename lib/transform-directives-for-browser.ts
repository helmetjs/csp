function createFirefoxPreCSP10Directives (directives, basePolicy) {
  const result = Object.assign({}, basePolicy);

  Object.keys(directives).forEach((key) => {
    const value = directives[key];

    if (key === 'connectSrc') {
      result.xhrSrc = value;
    } else {
      result[key] = value;
    }

    if (key === 'scriptSrc') {
      const optionsValues = [];

      if (value.indexOf("'unsafe-inline'") !== -1) {
        optionsValues.push('inline-script');
      }
      if (value.indexOf("'unsafe-eval'") !== -1) {
        optionsValues.push('eval-script');
      }

      if (optionsValues.length !== 0) {
        result.options = optionsValues;
      }
    }
  });

  return result;
}

const handlers = {
  Firefox (browser, directives) {
    const version = parseFloat(browser.version);

    if (version >= 4 && version < 23) {
      const basePolicy = {};
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
    const { family } = browser.os;
    const version = parseFloat(browser.version);

    if (family === 'Firefox OS' && version < 32 || family === 'Android' && version < 25) {
      return createFirefoxPreCSP10Directives(directives, { defaultSrc: ['*'] });
    } else {
      return directives;
    }
  },
};

export = function transformDirectivesForBrowser (browser, directives) {
  const handler = handlers[browser.name];

  if (handler) {
    return handler(browser, directives);
  } else {
    return directives;
  }
}
