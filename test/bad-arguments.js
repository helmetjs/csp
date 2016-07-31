var csp = require('..')

var config = require('../lib/config')
var camelize = require('camelize')
var assert = require('assert')

describe('with bad arguments', function () {
  function throwTest (args, message) {
    var err

    try {
      csp.apply(null, args)
    } catch (e) {
      err = e
    }

    assert(err instanceof Error, 'Calling with ' + args + ' did not throw an error')
    assert.equal(err.message, message)
  }

  describe('missing directives', function () {
    it('errors without arguments', function () {
      throwTest([], 'csp must be called with arguments. See the documentation.')
    })

    it('errors with an object that has no "directives" key', function () {
      throwTest([{}], 'csp must have at least one directive under the "directives" key. See the documentation.')
      throwTest([{ reportOnly: true }], 'csp must have at least one directive under the "directives" key. See the documentation.')
    })

    it('errors with an empty directives object', function () {
      throwTest([{ directives: {} }], 'csp must have at least one directive under the "directives" key. See the documentation.')
    })

    it('errors with an invalid directive type', function () {
      throwTest([{
        directives: { 'fart-man': ['http://example.com'] }
      }], '"fart-man" is an invalid directive. See the documentation for the supported list. Force this by enabling loose mode.')
    })
  })

  Object.keys(config.directives).forEach(function (directiveKey) {
    var directiveInfo = config.directives[directiveKey]
    var camelizedKey = camelize(directiveKey)

    ;[directiveKey, camelizedKey].forEach(function (key) {
      function set (value) {
        var directives = {}
        directives[key] = value
        return [{ directives: directives }]
      }

      describe(key + ' directive', function () {
        if (directiveInfo.type === 'sourceList') {
          it('errors with an empty array', function () {
            throwTest(set([]), directiveKey + ' must have at least one value. To block everything, set ' + directiveKey + ' to ["\'none\'"].')
          })

          it('errors when called with an array that contains non-strings', function () {
            throwTest(set(['http://example.com', 69, 'https://example.com']), '"69" is not a valid source expression. Only non-empty strings are allowed.')
          })

          it('errors when called with non-array values', function () {
            [
              null,
              undefined,
              true,
              {},
              '',
              function () {}
            ].forEach(function (value) {
              throwTest(set(value), '"' + value + '" is not a valid value for ' + directiveKey + '. Use an array of strings.')
            })
          })

          it('errors with unquoted "self"', function () {
            throwTest(set(['self']), '"self" must be quoted in ' + directiveKey + '. Change it to "\'self\'" in your source list. Force this by enabling loose mode.')
          })

          it('errors with unquoted "none"', function () {
            throwTest(set(['none']), '"none" must be quoted in ' + directiveKey + '. Change it to "\'none\'" in your source list. Force this by enabling loose mode.')
          })

          if (directiveInfo.hasUnsafes) {
            it('errors when called with unquoted "unsafe-inline" or "unsafe-eval"', function () {
              throwTest(set(['unsafe-inline']), '"unsafe-inline" must be quoted in ' + directiveKey + '. Change it to "\'unsafe-inline\'" in your source list. Force this by enabling loose mode.')
              throwTest(set(['unsafe-eval']), '"unsafe-eval" must be quoted in ' + directiveKey + '. Change it to "\'unsafe-eval\'" in your source list. Force this by enabling loose mode.')
            })
          } else {
            it('errors when called with unsafe-inline or unsafe-eval', function () {
              throwTest(set(['unsafe-inline']), '"unsafe-inline" does not make sense in ' + directiveKey + '. Remove it.')
              throwTest(set(['unsafe-eval']), '"unsafe-eval" does not make sense in ' + directiveKey + '. Remove it.')
              throwTest(set(["'unsafe-inline'"]), '"\'unsafe-inline\'" does not make sense in ' + directiveKey + '. Remove it.')
              throwTest(set(["'unsafe-eval'"]), '"\'unsafe-eval\'" does not make sense in ' + directiveKey + '. Remove it.')
            })
          }
        } else if (directiveInfo.type === 'pluginTypes') {
          it('errors with an empty array', function () {
            throwTest(set([]), 'plugin-types must have at least one value. To block everything, set plugin-types to ["\'none\'"].')
          })

          it('errors when called with an array that contains non-strings', function () {
            throwTest(set(['application/x-shockwave-flash', 420]), '"420" is not a valid plugin type. Only non-empty strings are allowed.')
          })

          it('errors with unquoted "none"', function () {
            throwTest(set(['none']), '"none" must be quoted in plugin-types. Change it to "\'none\'" in your source list. Force this by enabling loose mode.')
          })

          it("errors when called with 'self'", function () {
            throwTest(set(['self']), '"self" does not make sense in plugin-types. Remove it.')
            throwTest(set(["'self'"]), '"\'self\'" does not make sense in plugin-types. Remove it.')
          })

          it('errors when called with unsafe-inline or unsafe-eval', function () {
            throwTest(set(['unsafe-inline']), '"unsafe-inline" does not make sense in ' + directiveKey + '. Remove it.')
            throwTest(set(['unsafe-eval']), '"unsafe-eval" does not make sense in ' + directiveKey + '. Remove it.')
            throwTest(set(["'unsafe-inline'"]), '"\'unsafe-inline\'" does not make sense in ' + directiveKey + '. Remove it.')
            throwTest(set(["'unsafe-eval'"]), '"\'unsafe-eval\'" does not make sense in ' + directiveKey + '. Remove it.')
          })

          it('errors when called with non-array values', function () {
            [
              null,
              undefined,
              true,
              {},
              ''
            ].forEach(function (value) {
              throwTest(set(value), '"' + value + '" is not a valid value for plugin-types. Use an array of strings.')
            })
          })
        } else if (directiveInfo.type === 'sandbox') {
          it('errors with an empty array', function () {
            throwTest(set([]), 'sandbox must have at least one value. To block everything, set sandbox to `true`.')
          })

          it('errors when called with non-array values', function () {
            [
              null,
              undefined,
              {},
              ''
            ].forEach(function (value) {
              throwTest(set(value), '"' + value + '" is not a valid value for sandbox. Use an array of strings or `true`.')
            })
          })

          it('errors when called with unsupported directives', function () {
            throwTest(set(['allow-forms', undefined]), '"undefined" is not a valid sandbox directive. Remove it.')
            throwTest(set(['allow-forms', 123]), '"123" is not a valid sandbox directive. Remove it.')
            throwTest(set(['allow-foo']), '"allow-foo" is not a valid sandbox directive. Remove it.')
            throwTest(set(['self']), '"self" is not a valid sandbox directive. Remove it.')
            throwTest(set(["'self'"]), '"\'self\'" is not a valid sandbox directive. Remove it.')
            throwTest(set(['none']), '"none" is not a valid sandbox directive. Remove it.')
            throwTest(set(["'none'"]), '"\'none\'" is not a valid sandbox directive. Remove it.')
          })
        } else if (directiveInfo.type === 'reportUri') {
          it('errors when called with non-string values', function () {
            [
              null,
              undefined,
              {},
              { length: 0 },
              { length: 2 },
              [],
              ['example.com'],
              123,
              true,
              ''
            ].forEach(function (value) {
              throwTest(set(value), '"' + value + '" is not a valid value for report-uri. Use a non-empty string.')
            })
          })
        } else {
          it('should never run this!', function () {
            assert(false, directiveInfo.type + ' directive type is untested!')
          })
        }
      })
    })
  })
})
