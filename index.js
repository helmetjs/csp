var camelize = require('camelize')
var cspBuilder = require('content-security-policy-builder')
var containsFunction = require('./lib/contains-function')
var parseDynamicDirectives = require('./lib/parse-dynamic-directives')
var getUABasedBrowser = require('./lib/get-ua-based-browser')
var getStandardBrowser = require('./lib/get-standard-browser')

module.exports = function csp (options) {
  options = options || {}

  var originalDirectives = camelize(options.directives || {})
  var directivesAreDynamic = containsFunction(originalDirectives)

  if (options.reportOnly && !originalDirectives.reportUri) {
    throw new Error('Please remove reportOnly or add a report-uri.')
  }

  var setLegacyHeaders
  if (options.hasOwnProperty('setLegacyHeaders')) {
    setLegacyHeaders = options.setLegacyHeaders
  } else {
    setLegacyHeaders = true
  }

  if (options.setAllHeaders && !setLegacyHeaders) {
    throw new Error('setAllHeaders cannot be true if setLegacyHeaders is false')
  }

  var getBrowser
  if (setLegacyHeaders) {
    getBrowser = getUABasedBrowser
  } else {
    getBrowser = getStandardBrowser
  }

  return function csp (req, res, next) {
    var userAgent = req.headers['user-agent']

    var browser = getBrowser(userAgent, originalDirectives, options)
    if (browser.headerKeys.length === 0) {
      next()
      return
    }

    var headerKeys = browser.headerKeys
    var directives = browser.directives

    if (directivesAreDynamic) {
      directives = parseDynamicDirectives(directives, [req, res])
    }

    var policyString = cspBuilder({ directives: directives })

    headerKeys.forEach(function (headerKey) {
      if (options.reportOnly) {
        headerKey += '-Report-Only'
      }
      res.setHeader(headerKey, policyString)
    })

    next()
  }
}
