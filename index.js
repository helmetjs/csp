var platform = require("platform");

var config = require("./lib/config");
var parseDirectivesFromOptions = require("./lib/parse-directives");
var browserHandlers = require("./lib/browser-handlers");
var makePolicyString = require("./lib/make-policy-string");

module.exports = function csp(options) {

  options = options || { "default-src": ["'self'"] };
  var directives = parseDirectivesFromOptions(options);
  if (options.reportOnly && !directives["report-uri"]) {
    throw new Error("Please remove reportOnly or add a report-uri.");
  }

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
      policyString = makePolicyString(headerData.directives);
    }

    headerData.headers.forEach(function(header) {
      var headerName = header;
      if (options.reportOnly) { headerName += "-Report-Only"; }
      res.setHeader(headerName, policyString);
    });

    next();

  };

};
