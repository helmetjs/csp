var ALL_HEADERS = require('./all-headers')

var handlers = {
  IE: function (browser) {
    var header = browser.version < 12 ? 'X-Content-Security-Policy' : 'Content-Security-Policy'

    return [header]
  },

  Firefox: function (browser) {
    var version = parseFloat(browser.version)

    if (version >= 23) {
      return ['Content-Security-Policy']
    } else if (version >= 4 && version < 23) {
      return ['X-Content-Security-Policy']
    } else {
      return []
    }
  },

  Chrome: function (browser) {
    var version = parseFloat(browser.version)

    if (version >= 14 && version < 25) {
      return ['X-WebKit-CSP']
    } else if (version >= 25) {
      return ['Content-Security-Policy']
    } else {
      return []
    }
  },

  Safari: function (browser) {
    var version = parseFloat(browser.version)

    if (version >= 7) {
      return ['Content-Security-Policy']
    } else if (version >= 6) {
      return ['X-WebKit-CSP']
    } else {
      return []
    }
  },

  Opera: function (browser) {
    if (parseFloat(browser.version) >= 15) {
      return ['Content-Security-Policy']
    } else {
      return []
    }
  },

  'Android Browser': function (browser, options) {
    if (parseFloat(browser.os.version) < 4.4 || options.disableAndroid) {
      return []
    } else {
      return ['Content-Security-Policy']
    }
  },

  'Chrome Mobile': function (browser) {
    if (browser.os.family === 'iOS') {
      return ['Content-Security-Policy']
    } else {
      return handlers['Android Browser'].apply(this, arguments)
    }
  }
}

module.exports = function getHeaderKeysForBrowser (browser, options) {
  var handler = handlers[browser.name]

  if (handler) {
    return handler(browser, options)
  } else {
    return ALL_HEADERS
  }
}
