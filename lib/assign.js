module.exports = function (destination) {
  var source

  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i]
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        destination[key] = source[key]
      }
    }
  }

  return destination
}
