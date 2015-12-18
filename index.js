var platform = require('platform')
var cspBuilder = require('content-security-policy-builder')
var isString = require('lodash.isstring')
var pick = require('lodash.pick')
var reduce = require('lodash.reduce')
var some = require('lodash.some')
var camelize = require('camelize')

var config = require('./lib/config')
var browserHandlers = require('./lib/browser-handlers')

module.exports = function csp (passedOptions) {
  var options = camelize(passedOptions) || { defaultSrc: "'self'" }
  checkOptions(options)

  var directives = pick(options, config.supportedDirectives)
  var dynamic = isDynamic(directives)

  return function csp (req, res, next) {
    var browser = platform.parse(req.headers['user-agent'])
    var browserHandler = browserHandlers[browser.name] || browserHandlers.default

    var headerData = browserHandler(browser, directives, options)

    if (options.setAllHeaders) {
      headerData.headers = config.allHeaders
    }
    headerData.directives = headerData.directives || directives
    if (dynamic) {
      headerData.directives = parseDynamic(headerData.directives, [req])
    }

    var policyString
    if (headerData.headers.length) {
      policyString = cspBuilder({ directives: headerData.directives })
    }

    headerData.headers.forEach(function (header) {
      var headerName = header
      if (options.reportOnly) { headerName += '-Report-Only' }
      res.setHeader(headerName, policyString)
    })

    next()
  }
}

function checkOptions (options) {
  if (options.reportOnly && !options.reportUri) {
    throw new Error('Please remove reportOnly or add a report-uri.')
  }

  Object.keys(options).forEach(function (key) {
    var value = options[key]

    if (isString(value)) {
      value = value.trim().split(/\s+/)
    } else if (!Array.isArray(value)) {
      return
    }

    config.mustBeQuoted.forEach(function (mustBeQuoted) {
      if (value.indexOf(mustBeQuoted) !== -1) {
        throw new Error(mustBeQuoted + ' must be quoted.')
      }
    })
  })
}

// Runs through directives to see if any value is a function
function isDynamic (directives) {
  return some(directives, function (directive) {
    directive = [].concat(directive) // cast to array
    return some(directive, function (val) {
      return typeof val === 'function'
    })
  })
}

// Parses dynamic directives, returning a brand new object where
// all functions have been turned into string
function parseDynamic (value, args) {
  if (Array.isArray(value)) {
    return value.map(function (directive) {
      return parseDynamic(directive, args)
    })
  }

  if (typeof value === 'function') {
    return parseDynamic(value.apply(null, args), args)
  }

  if (typeof value === 'object') {
    return reduce(value, function (memo, directive, key) {
      memo[key] = parseDynamic(directive, args)
      return memo
    }, {})
  }

  return value
}
