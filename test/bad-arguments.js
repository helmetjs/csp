var csp = require('..')

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

  describe('default-src', function () {
    it('errors with an empty array', function () {
      throwTest([{
        directives: { defaultSrc: [] }
      }], 'default-src must have at least one value. To block everything, set default-src to ["\'none\'"].')
    })

    it('errors when called with an array that contains non-strings', function () {
      throwTest([{
        directives: {
          defaultSrc: ['http://example.com', 69, 'https://example.com']
        }
      }], '"69" is not a valid source expression. Only non-empty strings are allowed.')
    })

    it('errors when called with non-array values', function () {
      [
        null,
        undefined,
        true,
        {},
        ''
      ].forEach(function (value) {
        throwTest([{
          directives: { defaultSrc: value }
        }], '"' + value + '" is not a valid value for default-src. Use an array of strings.')
      })
    })

    it('errors when called with unquoted "self"', function () {
      throwTest([{
        directives: { defaultSrc: ['self'] }
      }], '"self" must be quoted in default-src. Change it to "\'self\'" in your source list. Force this by enabling loose mode.')
    })

    it('errors when called with unquoted "none"', function () {
      throwTest([{
        directives: { defaultSrc: ['none'] }
      }], '"none" must be quoted in default-src. Change it to "\'none\'" in your source list. Force this by enabling loose mode.')
    })

    it('errors when called with unsafe-inline or unsafe-eval', function () {
      throwTest([{
        directives: { defaultSrc: ['unsafe-inline'] }
      }], '"unsafe-inline" does not make sense in default-src. Remove it.')
      throwTest([{
        directives: { defaultSrc: ['unsafe-eval'] }
      }], '"unsafe-eval" does not make sense in default-src. Remove it.')
      throwTest([{
        directives: { defaultSrc: ["'unsafe-inline'"] }
      }], '"\'unsafe-inline\'" does not make sense in default-src. Remove it.')
      throwTest([{
        directives: { defaultSrc: ["'unsafe-eval'"] }
      }], '"\'unsafe-eval\'" does not make sense in default-src. Remove it.')
    })
  })
})
