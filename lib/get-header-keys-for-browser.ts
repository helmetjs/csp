import config from './config';
import { CSPOptions } from './types';

function goodBrowser () {
  return ['Content-Security-Policy'];
}

interface Handlers {
  [browser: string]: (platform: Platform, options: CSPOptions) => string[];
}

// This is easier than converting `browser` to have non-undefined fields for now.
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const handlers: Handlers = {
  'Android Browser' (browser, options) {
    if (parseFloat(browser.os!.version!) < 4.4 || options.disableAndroid) {
      return [];
    } else {
      return ['Content-Security-Policy'];
    }
  },

  Chrome (browser) {
    const version = parseFloat(browser.version!);

    if (version >= 14 && version < 25) {
      return ['X-WebKit-CSP'];
    } else if (version >= 25) {
      return ['Content-Security-Policy'];
    } else {
      return [];
    }
  },

  'Chrome Mobile' (browser, options) {
    if (browser.os!.family === 'iOS') {
      return ['Content-Security-Policy'];
    } else {
      return handlers['Android Browser'].apply(this, [browser, options]);
    }
  },

  Firefox (browser) {
    const version = parseFloat(browser.version!);

    if (version >= 23) {
      return ['Content-Security-Policy'];
    } else if (version >= 4 && version < 23) {
      return ['X-Content-Security-Policy'];
    } else {
      return [];
    }
  },

  'Firefox Mobile' (browser) {
    // Handles both Firefox for Android and Firefox OS
    const { family } = browser.os!;
    const version = parseFloat(browser.version!);

    if (family === 'Firefox OS') {
      if (version >= 32) {
        return ['Content-Security-Policy'];
      } else {
        return ['X-Content-Security-Policy'];
      }
    } else if (family === 'Android') {
      if (version >= 25) {
        return ['Content-Security-Policy'];
      } else {
        return ['X-Content-Security-Policy'];
      }
    }

    return [];
  },

  'Firefox for iOS': goodBrowser,

  IE (browser) {
    const version = parseFloat(browser.version!);
    const header = version < 12 ? 'X-Content-Security-Policy' : 'Content-Security-Policy';

    return [header];
  },

  'Microsoft Edge': goodBrowser,

  'Microsoft Edge Mobile': goodBrowser,

  Opera (browser) {
    if (parseFloat(browser.version!) >= 15) {
      return ['Content-Security-Policy'];
    } else {
      return [];
    }
  },

  Safari (browser) {
    const version = parseFloat(browser.version!);

    if (version >= 7) {
      return ['Content-Security-Policy'];
    } else if (version >= 6) {
      return ['X-WebKit-CSP'];
    } else {
      return [];
    }
  },
};

handlers['IE Mobile'] = handlers.IE;

export = function getHeaderKeysForBrowser (browser: Platform | undefined, options: CSPOptions) {
  if (!browser || !browser.name) {
    return config.allHeaders;
  }

  const handler = handlers[browser.name];

  if (handler) {
    return handler(browser, options);
  } else {
    return config.allHeaders;
  }
}
