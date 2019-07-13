var hasOwnProperty = Object.prototype.hasOwnProperty

module.exports = function has (obj, key) {
  return hasOwnProperty.call(obj, key)
}
