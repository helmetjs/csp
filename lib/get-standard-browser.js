var CSP_HEADER = require('./headers').CSP

module.exports = function getStandardBrowser (userAgent, directives) {
  return {
    headerKeys: [CSP_HEADER],
    directives: directives
  }
}
