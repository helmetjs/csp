var platform = require("platform");
var cspBuilder = require("content-security-policy-builder");
var isString = require("lodash.isstring");
var pick = require("lodash.pick");
var camelize = require("camelize");

var config = require("./lib/config");
var browserHandlers = require("./lib/browser-handlers");

module.exports = function csp(passedOptions) {
  var options = camelize(passedOptions) || { defaultSrc: "'self'" };
  checkOptions(options);

  var directives = pick(options, config.supportedDirectives);

  return function csp(req, res, next) {
    var browser = platform.parse(req.headers["user-agent"]);
    var browserHandler = browserHandlers[browser.name] || browserHandlers.default;

    var headerData = browserHandler(browser, directives, options);

    if (options.setAllHeaders) {
      headerData.headers = config.allHeaders;
    }
    headerData.directives = headerData.directives || directives;

    var policyString;
    if (headerData.headers.length) {
      policyString = cspBuilder({ directives: headerData.directives });
    }

    headerData.headers.forEach(function(header) {
      var headerName = header;
      if (options.reportOnly) { headerName += "-Report-Only"; }
      res.setHeader(headerName, policyString);
    });

    next();
  };
};

function checkOptions(options) {
  if (options.reportOnly && !options.reportUri) {
    throw new Error("Please remove reportOnly or add a report-uri.");
  }

  Object.keys(options).forEach(function (key) {
    var value = options[key];

    if (isString(value)) {
      value = value.trim().split(/\s+/);
    } else if (!Array.isArray(value)) {
      return;
    }

    config.mustBeQuoted.forEach(function (mustBeQuoted) {
      if (value.indexOf(mustBeQuoted) !== -1) {
        throw new Error(mustBeQuoted + " must be quoted.");
      }
    });
  });
}
