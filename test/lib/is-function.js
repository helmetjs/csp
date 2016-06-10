var isFunction = require('../../lib/is-function')

var assert = require('assert')

describe('isFunction', function () {
  it('returns true for normal functions', function () {
    function foo () {}

    assert(isFunction(foo))
    assert(isFunction(function () {}))
    assert(isFunction(new Function('return 5'))) // eslint-disable-line no-new-func
  })

  it('returns false for non-functions', function () {
    assert(!isFunction())
    assert(!isFunction(''))
    assert(!isFunction(true))
    assert(!isFunction(false))
    assert(!isFunction(null))
    assert(!isFunction('function () {}'))
    assert(!isFunction([]))
    assert(!isFunction([function () {}]))
    assert(!isFunction({}))
  })
})
