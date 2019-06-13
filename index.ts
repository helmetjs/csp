import camelize from 'camelize';
import cspBuilder from 'content-security-policy-builder';
import platform from 'platform';
import { IncomingMessage, ServerResponse } from 'http';

import isFunction from './lib/is-function';
import checkOptions from './lib/check-options';
import containsFunction from './lib/contains-function';
import getHeaderKeysForBrowser from './lib/get-header-keys-for-browser';
import transformDirectivesForBrowser from './lib/transform-directives-for-browser';
import parseDynamicDirectives from './lib/parse-dynamic-directives';
import config from './lib/config';

interface CSPOptions {
  browserSniff?: boolean;
  directives?: any;
  reportOnly?: any;
  setAllHeaders?: boolean;
}

export = function csp (options: CSPOptions = {}) {
  checkOptions(options);

  const originalDirectives = camelize(options.directives || {});
  const directivesAreDynamic = containsFunction(originalDirectives);
  const shouldBrowserSniff = options.browserSniff !== false;
  const reportOnlyIsFunction = isFunction(options.reportOnly);

  if (shouldBrowserSniff) {
    return function csp (req: IncomingMessage, res: ServerResponse, next: () => void) {
      const userAgent = req.headers['user-agent'];

      let browser;
      if (userAgent) {
        browser = platform.parse(userAgent);
      } else {
        browser = {};
      }

      let headerKeys;
      if (options.setAllHeaders || !userAgent) {
        headerKeys = config.allHeaders;
      } else {
        headerKeys = getHeaderKeysForBrowser(browser, options);
      }

      if (headerKeys.length === 0) {
        next();
        return;
      }

      let directives = transformDirectivesForBrowser(browser, originalDirectives);

      if (directivesAreDynamic) {
        directives = parseDynamicDirectives(directives, [req, res]);
      }

      const policyString = cspBuilder({ directives });

      headerKeys.forEach((headerKey) => {
        if (reportOnlyIsFunction && options.reportOnly(req, res) ||
            !reportOnlyIsFunction && options.reportOnly) {
          headerKey += '-Report-Only';
        }
        res.setHeader(headerKey, policyString);
      });

      next();
    };
  } else {
    let headerKeys: string[];
    if (options.setAllHeaders) {
      headerKeys = config.allHeaders;
    } else {
      headerKeys = ['Content-Security-Policy'];
    }

    return function csp (req: IncomingMessage, res: ServerResponse, next: () => void) {
      const directives = parseDynamicDirectives(originalDirectives, [req, res]);
      const policyString = cspBuilder({ directives });

      if (reportOnlyIsFunction && options.reportOnly(req, res) ||
          !reportOnlyIsFunction && options.reportOnly) {
        headerKeys.forEach((headerKey) => {
          res.setHeader(`${headerKey}-Report-Only`, policyString);
        });
      } else {
        headerKeys.forEach((headerKey) => {
          res.setHeader(headerKey, policyString);
        });
      }

      next();
    };
  }
};
