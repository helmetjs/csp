var isString = require('../../lib/is-string')

var assert = require('assert')

describe('isString', function () {
  it('returns true for strings', function () {
    assert(isString(''))
    assert(isString('hello world'))
    assert(isString(new String(''))) // eslint-disable-line no-new-wrappers
    assert(isString(new String('hi hi'))) // eslint-disable-line no-new-wrappers
  })

  it('returns false for non-strings', function () {
    assert(!isString())
    assert(!isString(function () {}))
    assert(!isString(true))
    assert(!isString(false))
    assert(!isString(null))
    assert(!isString(0))
    assert(!isString(123))
    assert(!isString([]))
    assert(!isString({}))
  })
})

