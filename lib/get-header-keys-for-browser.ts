import config from './config';
import { CspOptions } from './types';
import * as Bowser from 'bowser';

function goodBrowser () {
  return ['Content-Security-Policy'];
}

interface HandlersByBrowserName {
  [browserName: string]: (browser: Bowser.Parser.Parser, options: CspOptions) => string[];
}

const handlersByBrowserName: HandlersByBrowserName = {
  'Android Browser' (browser) {
    const osVersionName = browser.getOS().versionName;
    if (osVersionName && parseFloat(osVersionName) < 4.4) {
      return [];
    }
    return ['Content-Security-Policy'];
  },

  Chrome (browser) {
    const browserVersion = parseFloat(browser.getBrowserVersion());
    if (browserVersion >= 14 && browserVersion < 25) {
      return ['X-WebKit-CSP'];
    } else if (browserVersion >= 25) {
      return ['Content-Security-Policy'];
    } else {
      return [];
    }
  },

  'Chrome Mobile' (browser, options) {
    if (browser.getOSName() === 'iOS') {
      return ['Content-Security-Policy'];
    } else {
      return handlersByBrowserName['Android Browser'](browser, options);
    }
  },

  Firefox (browser) {
    const osName = browser.getOSName();
    if (osName === 'iOS') {
      return ['Content-Security-Policy'];
    }

    const browserVersion = parseFloat(browser.getBrowserVersion());
    if (osName === 'Android') {
      if (browserVersion >= 25) {
        return ['Content-Security-Policy'];
      } else {
        return ['X-Content-Security-Policy'];
      }
    } else if (browser.getPlatformType(true) === 'mobile') {
      // This is probably Firefox OS.
      if (browserVersion >= 32) {
        return ['Content-Security-Policy'];
      } else {
        return ['X-Content-Security-Policy'];
      }
    } else if (browserVersion >= 23) {
      return ['Content-Security-Policy'];
    } else if (browserVersion >= 4 && browserVersion < 23) {
      return ['X-Content-Security-Policy'];
    } else {
      return [];
    }
  },

  'Internet Explorer' (browser) {
    const browserVersion = parseFloat(browser.getBrowserVersion());
    const header = browserVersion < 12 ? 'X-Content-Security-Policy' : 'Content-Security-Policy';
    return [header];
  },

  'Microsoft Edge': goodBrowser,

  'Microsoft Edge Mobile': goodBrowser,

  Opera (browser) {
    const browserVersion = parseFloat(browser.getBrowserVersion());
    if (browserVersion >= 15) {
      return ['Content-Security-Policy'];
    } else {
      return [];
    }
  },

  Safari (browser) {
    const browserVersion = parseFloat(browser.getBrowserVersion());
    if (browserVersion >= 7) {
      return ['Content-Security-Policy'];
    } else if (browserVersion >= 6) {
      return ['X-WebKit-CSP'];
    } else {
      return [];
    }
  },
};

export = function getHeaderKeysForBrowser (browser: Bowser.Parser.Parser | undefined, options: CspOptions) {
  if (!browser) {
    return config.allHeaders;
  }

  if (options.disableAndroid && browser.getOSName()==='Android') {
    return [];
  }

  const browserName = browser.getBrowserName();
  if (Object.prototype.hasOwnProperty.call(handlersByBrowserName, browserName)) {
    return handlersByBrowserName[browserName](browser, options);
  } else {
    return config.allHeaders;
  }
}
