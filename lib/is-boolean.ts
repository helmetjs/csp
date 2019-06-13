export = function isBoolean (value: unknown) {
  return Object.prototype.toString.call(value) === '[object Boolean]';
}
