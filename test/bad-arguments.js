var csp = require('..')

var config = require('../lib/config')
var camelize = require('camelize')
var assert = require('assert')

var SOURCELIST_DIRECTIVES = [
  'base-uri', 'child-src', 'connect-src', 'default-src', 'font-src',
  'form-action', 'frame-ancestors', 'frame-src', 'img-src',
  'manifest-src', 'media-src', 'object-src', 'prefetch-src', 'script-src',
  'style-src', 'worker-src'
]
var SOURCELISTS_WITH_UNSAFES = ['script-src', 'style-src', 'worker-src']
var SOURCELISTS_WITH_STRICT_DYNAMIC = ['default-src', 'script-src']
var BOOLEAN_DIRECTIVES = ['block-all-mixed-content', 'upgrade-insecure-requests']
var PLUGINTYPE_DIRECTIVES = ['plugin-types']
var URI_DIRECTIVES = ['report-to', 'report-uri']
var REQUIRESRIFOR_DIRECTIVES = ['require-sri-for']
var SANDBOX_DIRECTIVES = ['sandbox']

describe('with bad arguments', function () {
  describe('missing directives', function () {
    it('errors without arguments', function () {
      assertThrowsWithArg('NO_ARGUMENTS', 'csp must be called with an object argument. See the documentation.')
    })

    it('errors with non-objects', function () {
      [
        undefined,
        null,
        true,
        false,
        0,
        1,
        '',
        'str',
        [],
        [{ directives: {} }]
      ].forEach(function (arg) {
        assertThrowsWithArg(arg, 'csp must be called with an object argument. See the documentation.')
      })
    })

    it('errors with an object that has no "directives" key', function () {
      assertThrowsWithArg({}, 'csp must have at least one directive under the "directives" key. See the documentation.')
      assertThrowsWithArg({ reportOnly: true }, 'csp must have at least one directive under the "directives" key. See the documentation.')
    })

    it('errors with an empty directives object', function () {
      assertThrowsWithArg({ directives: {} }, 'csp must have at least one directive under the "directives" key. See the documentation.')
    })

    it('errors with an invalid directive type', function () {
      assertThrowsWithArg({
        directives: { 'fart-man': ['http://example.com'] }
      }, '"fart-man" is an invalid directive. See the documentation for the supported list. Force this by enabling loose mode.')
    })
  })

  it('tests all directives', function () {
    var actualDirectives = Object.keys(config.directives)
    var expectedDirectives = SOURCELIST_DIRECTIVES.concat(BOOLEAN_DIRECTIVES, PLUGINTYPE_DIRECTIVES, URI_DIRECTIVES, REQUIRESRIFOR_DIRECTIVES, SANDBOX_DIRECTIVES)
    assert.deepEqual(actualDirectives.sort(), expectedDirectives.sort())
  })

  SOURCELIST_DIRECTIVES.forEach(function (directive) {
    [directive, camelize(directive)].forEach(function (key) {
      describe(key + ' directive, a source list', function () {
        it('errors with an empty array', function () {
          assertThrowsWithDirective(key, [], directive + ' must have at least one value. To block everything, set ' + directive + ' to ["\'none\'"].')
        })

        it('errors with a non-array', function () {
          [
            null,
            undefined,
            true,
            {},
            '',
            'https://example.com',
            function () {}
          ].forEach(function (value) {
            assertThrowsWithDirective(key, value, '"' + value + '" is not a valid value for ' + directive + '. Use an array of strings.')
          })
        })

        it('errors with an array that contains non-numbers', function () {
          assertThrowsWithDirective(key, ['http://example.com', 69, 'https://example.com'], '"69" is not a valid source expression. Only non-empty strings are allowed.')
        })

        it('errors with unquoted values', function () {
          assertThrowsWithDirective(key, ['self'], '"self" must be quoted in ' + directive + '. Change it to "\'self\'" in your source list. Force this by enabling loose mode.')
          assertThrowsWithDirective(key, ['none'], '"none" must be quoted in ' + directive + '. Change it to "\'none\'" in your source list. Force this by enabling loose mode.')
          if (SOURCELISTS_WITH_UNSAFES.indexOf(directive) !== -1) {
            assertThrowsWithDirective(key, ['unsafe-inline'], '"unsafe-inline" must be quoted in ' + directive + '. Change it to "\'unsafe-inline\'" in your source list. Force this by enabling loose mode.')
            assertThrowsWithDirective(key, ['unsafe-eval'], '"unsafe-eval" must be quoted in ' + directive + '. Change it to "\'unsafe-eval\'" in your source list. Force this by enabling loose mode.')
          }
          if (SOURCELISTS_WITH_STRICT_DYNAMIC.indexOf(directive) !== -1) {
            assertThrowsWithDirective(key, ['strict-dynamic'], '"strict-dynamic" must be quoted in ' + directive + '. Change it to "\'strict-dynamic\'" in your source list. Force this by enabling loose mode.')
          }
        })

        if (SOURCELISTS_WITH_UNSAFES.indexOf(directive) === -1) {
          it('errors when called with unsafe-inline or unsafe-eval', function () {
            assertThrowsWithDirective(key, ['unsafe-inline'], '"unsafe-inline" does not make sense in ' + directive + '. Remove it.')
            assertThrowsWithDirective(key, ['unsafe-eval'], '"unsafe-eval" does not make sense in ' + directive + '. Remove it.')
            assertThrowsWithDirective(key, ["'unsafe-inline'"], '"\'unsafe-inline\'" does not make sense in ' + directive + '. Remove it.')
            assertThrowsWithDirective(key, ["'unsafe-eval'"], '"\'unsafe-eval\'" does not make sense in ' + directive + '. Remove it.')
          })
        }

        if (SOURCELISTS_WITH_STRICT_DYNAMIC.indexOf(directive) === -1) {
          it('errors when called with strict-dynamic', function () {
            assertThrowsWithDirective(key, ['strict-dynamic'], '"strict-dynamic" does not make sense in ' + directive + '. Remove it.')
            assertThrowsWithDirective(key, ["'strict-dynamic'"], '"\'strict-dynamic\'" does not make sense in ' + directive + '. Remove it.')
          })
        }
      })
    })
  })

  BOOLEAN_DIRECTIVES.forEach(function (directive) {
    [directive, camelize(directive)].forEach(function (key) {
      describe(key + ' directive, a boolean', function () {
        it('errors when called with non-boolean values', function () {
          [
            null,
            undefined,
            {},
            [],
            ['example.com'],
            123,
            '',
            'true',
            'false',
            [true]
          ].forEach(function (value) {
            assertThrowsWithDirective(key, value, '"' + value + '" is not a valid value for ' + directive + '. Use `true` or `false`.')
          })
        })
      })
    })
  })

  PLUGINTYPE_DIRECTIVES.forEach(function (directive) {
    [directive, camelize(directive)].forEach(function (key) {
      describe(key + ' directive', function () {
        it('errors with an empty array', function () {
          assertThrowsWithDirective(key, [], directive + ' must have at least one value. To block everything, set ' + directive + ' to ["\'none\'"].')
        })

        it('errors with a non-array', function () {
          [
            null,
            undefined,
            true,
            {},
            '',
            'https://example.com',
            function () {}
          ].forEach(function (value) {
            assertThrowsWithDirective(key, value, '"' + value + '" is not a valid value for ' + directive + '. Use an array of strings.')
          })
        })

        it('errors when called with an array that contains non-strings', function () {
          assertThrowsWithDirective(key, ['application/x-shockwave-flash', 420], '"420" is not a valid plugin type. Only non-empty strings are allowed.')
        })

        it('errors with unquoted values', function () {
          assertThrowsWithDirective(key, ['none'], '"none" must be quoted in ' + directive + '. Change it to "\'none\'" in your source list. Force this by enabling loose mode.')
        })

        it("errors when called with values that don't make sense, like 'self', 'unsafe-inline', and 'unsafe-eval'", function () {
          assertThrowsWithDirective(key, ['self'], '"self" does not make sense in ' + directive + '. Remove it.')
          assertThrowsWithDirective(key, ['unsafe-inline'], '"unsafe-inline" does not make sense in ' + directive + '. Remove it.')
          assertThrowsWithDirective(key, ['unsafe-eval'], '"unsafe-eval" does not make sense in ' + directive + '. Remove it.')
          assertThrowsWithDirective(key, ["'self'"], '"\'self\'" does not make sense in ' + directive + '. Remove it.')
          assertThrowsWithDirective(key, ["'unsafe-inline'"], '"\'unsafe-inline\'" does not make sense in ' + directive + '. Remove it.')
          assertThrowsWithDirective(key, ["'unsafe-eval'"], '"\'unsafe-eval\'" does not make sense in ' + directive + '. Remove it.')
        })
      })
    })
  })

  URI_DIRECTIVES.forEach(function (directive) {
    [directive, camelize(directive)].forEach(function (key) {
      describe(key + ' directive, a URI', function () {
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
            assertThrowsWithDirective(key, value, '"' + value + '" is not a valid value for ' + directive + '. Use a non-empty string.')
          })
        })
      })
    })
  })

  assert.deepEqual(REQUIRESRIFOR_DIRECTIVES, ['require-sri-for'])

  REQUIRESRIFOR_DIRECTIVES.forEach(function (directive) {
    [directive, camelize(directive)].forEach(function (key) {
      describe(key + ' directive, a require-sri-for', function () {
        it('errors with an empty array', function () {
          assertThrowsWithDirective(key, [], 'require-sri-for must have at least one value. To require nothing, omit the directive.')
        })

        it('errors with a non-array', function () {
          [
            null,
            undefined,
            true,
            {},
            '',
            'script',
            function () {}
          ].forEach(function (value) {
            assertThrowsWithDirective(key, value, '"' + value + '" is not a valid value for require-sri-for. Use an array of strings.')
          })
        })

        it('errors when called with unsupported directives', function () {
          assertThrowsWithDirective(key, [undefined], '"undefined" is not a valid require-sri-for value. Remove it.')
          assertThrowsWithDirective(key, ['script', undefined], '"undefined" is not a valid require-sri-for value. Remove it.')
          assertThrowsWithDirective(key, ['style', 123], '"123" is not a valid require-sri-for value. Remove it.')
          assertThrowsWithDirective(key, ['style', 'self'], '"self" is not a valid require-sri-for value. Remove it.')
          assertThrowsWithDirective(key, ["'none'", 'script'], '"\'none\'" is not a valid require-sri-for value. Remove it.')
        })
      })
    })
  })

  describe('sandbox directive', function () {
    it('is the only directive of its type', function () {
      assert.deepEqual(SANDBOX_DIRECTIVES, ['sandbox'])
    })

    it('errors with an empty array', function () {
      assertThrowsWithDirective('sandbox', [], 'sandbox must have at least one value. To block everything, set sandbox to `true`.')
    })

    it('errors when called with non-array values', function () {
      [
        null,
        undefined,
        {},
        '',
        0,
        1
      ].forEach(function (value) {
        assertThrowsWithDirective('sandbox', value, '"' + value + '" is not a valid value for sandbox. Use an array of strings or `true`.')
      })
    })

    it('errors when called with unsupported directives', function () {
      assertThrowsWithDirective('sandbox', ['allow-forms', undefined], '"undefined" is not a valid sandbox directive. Remove it.')
      assertThrowsWithDirective('sandbox', ['allow-forms', 123], '"123" is not a valid sandbox directive. Remove it.')
      assertThrowsWithDirective('sandbox', ['allow-foo'], '"allow-foo" is not a valid sandbox directive. Remove it.')
      assertThrowsWithDirective('sandbox', ['self'], '"self" is not a valid sandbox directive. Remove it.')
      assertThrowsWithDirective('sandbox', ["'self'"], '"\'self\'" is not a valid sandbox directive. Remove it.')
      assertThrowsWithDirective('sandbox', ['none'], '"none" is not a valid sandbox directive. Remove it.')
      assertThrowsWithDirective('sandbox', ["'none'"], '"\'none\'" is not a valid sandbox directive. Remove it.')
    })
  })
})

function assertThrowsWithArg (arg, expectedMessage) {
  assert.throws(
    function () {
      if (arg === 'NO_ARGUMENTS') {
        csp()
      } else {
        csp(arg)
      }
    },
    function (err) {
      var isError = err instanceof Error
      var isMessageOk = err.message === expectedMessage
      return isError && isMessageOk
    },
    'Calling with ' + arg + ' did not throw'
  )
}

function assertThrowsWithDirective (directiveKey, directiveValue, expectedMessage) {
  var arg = { directives: {} }
  arg.directives[directiveKey] = directiveValue
  assertThrowsWithArg(arg, expectedMessage)
}
