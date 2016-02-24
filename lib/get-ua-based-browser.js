var ALL_HEADERS = require('./all-headers')
var platform = require('platform')
var getHeaderKeysForBrowser = require('./get-header-keys-for-browser')
var transformDirectivesForBrowser = require('./transform-directives-for-browser')

module.exports = function getUABasedBrowser (userAgent, originalDirectives, options) {
  var browser
  if (userAgent) {
    browser = platform.parse(userAgent)
  } else {
    browser = {}
  }

  var headerKeys
  if (options.setAllHeaders || !userAgent) {
    headerKeys = ALL_HEADERS
  } else {
    headerKeys = getHeaderKeysForBrowser(browser, options)
  }

  var directives
  if (headerKeys.length) {
    directives = transformDirectivesForBrowser(browser, originalDirectives)
  }

  return {
    headerKeys: headerKeys,
    directives: directives
  }
}
