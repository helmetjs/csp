var isFunction = require('./is-function')
var has = require('./has')

module.exports = function containsFunction (obj) {
  for (var key in obj) {
    if (!has(obj, key)) { continue }

    var value = obj[key]

    if (!Array.isArray(value)) {
      value = [value]
    }

    if (value.some(isFunction)) {
      return true
    }
  }

  return false
}
