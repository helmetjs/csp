import * as Bowser from 'bowser';
import { CamelCaseDirectives as Directives, SourceListDirective } from './types';

interface BasePolicy {
  allow?: SourceListDirective;
  defaultSrc?: SourceListDirective;
}

function transformDirectivesForPreCsp1Firefox (directives: Directives, basePolicy: BasePolicy) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = Object.assign({}, basePolicy);

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

  // Rename `scriptSrcElem` values `unsafe-inline` and `unsafe-eval`
  const { scriptSrcElem } = directives;
  if (scriptSrcElem) {
    const optionsValues = [];

    if (scriptSrcElem.indexOf("'unsafe-inline'") !== -1) {
      optionsValues.push('inline-script');
    }
    if (scriptSrcElem.indexOf("'unsafe-eval'") !== -1) {
      optionsValues.push('eval-script');
    }

    if (optionsValues.length !== 0) {
      result.options = optionsValues;
    }
  }

  return result;
}

export = function transformDirectivesForBrowser (
  browser: Bowser.Parser.Parser | undefined,
  directives: Directives,
): Directives {
  // For now, Firefox is the only browser that needs to be transformed.
  if (!browser || browser.getBrowserName() !== 'Firefox') {
    return directives;
  }

  const osName = browser.getOSName();

  if (osName === 'iOS') {
    return directives;
  }

  const browserVersion = parseFloat(browser.getBrowserVersion());

  if (
    osName === 'Android' && browserVersion < 25 ||
    browser.getPlatformType(true) === 'mobile' && browserVersion < 32
  ) {
    return transformDirectivesForPreCsp1Firefox(directives, { defaultSrc: ['*'] });
  } else if (browserVersion >= 4 && browserVersion < 23) {
    const basePolicy: BasePolicy = {};
    if (browserVersion < 5) {
      basePolicy.allow = ['*'];

      if (directives.defaultSrc) {
        basePolicy.allow = directives.defaultSrc;
        directives = Object.assign({}, directives);
        delete directives.defaultSrc;
      }
    } else {
      basePolicy.defaultSrc = ['*'];
    }

    return transformDirectivesForPreCsp1Firefox(directives, basePolicy);
  } else {
    return directives;
  }
}
