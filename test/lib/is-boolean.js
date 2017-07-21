var isBoolean = require('../../lib/is-boolean')

var assert = require('assert')

describe('isBoolean', function () {
  it('returns true for booleans', function () {
    assert(isBoolean(true))
    assert(isBoolean(false))
    assert(isBoolean(new Boolean(true))) // eslint-disable-line no-new-wrappers
    assert(isBoolean(new Boolean(false))) // eslint-disable-line no-new-wrappers
  })

  it('returns false for non-booleans', function () {
    assert(!isBoolean())
    assert(!isBoolean(function () {}))
    assert(!isBoolean(''))
    assert(!isBoolean('true'))
    assert(!isBoolean('false'))
    assert(!isBoolean(null))
    assert(!isBoolean(0))
    assert(!isBoolean(123))
    assert(!isBoolean([]))
    assert(!isBoolean({}))
  })
})
