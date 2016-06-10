var assign = require('../../lib/assign')

var assert = require('assert')

describe('assign', function () {
  it('returns the original object', function () {
    var obj = {}
    assert.equal(assign(obj, {}, { foo: 'boo' }), obj)
  })

  it('combines objects', function () {
    var a = { foo: 'boo' }
    var b = { yas: 'gaga', youlook: 'so good' }
    var c = { foo: 'bar', twenty: 5 }

    var actual = assign(a, b, c)
    var expected = {
      foo: 'bar',
      yas: 'gaga',
      youlook: 'so good',
      twenty: 5
    }

    assert.deepEqual(actual, expected)
    assert.deepEqual(a, expected)
  })
})
