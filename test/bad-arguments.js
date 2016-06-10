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
            ''
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
      })
    })
  })
})
