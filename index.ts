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
import { CSPOptions, CamelCaseDirectives, ParsedDirectives } from './lib/types';

export = function csp (options: CSPOptions) {
  checkOptions(options);

  const originalDirectives: CamelCaseDirectives = camelize(options.directives || {});
  const directivesAreDynamic = containsFunction(originalDirectives);
  const shouldBrowserSniff = options.browserSniff !== false;

  if (shouldBrowserSniff) {
    return function csp (req: IncomingMessage, res: ServerResponse, next: () => void) {
      const userAgent = req.headers['user-agent'];

      let browser;
      if (userAgent) {
        browser = platform.parse(userAgent);
      } else {
        browser = undefined;
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

      const policyString = cspBuilder({ directives: directives as ParsedDirectives });

      headerKeys.forEach((headerKey) => {
        if (isFunction(options.reportOnly) && options.reportOnly(req, res) ||
            !isFunction(options.reportOnly) && options.reportOnly) {
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

      if (isFunction(options.reportOnly) && options.reportOnly(req, res) ||
          !isFunction(options.reportOnly) && options.reportOnly) {
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
