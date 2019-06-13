export = function isString (value: unknown) {
  return Object.prototype.toString.call(value) === '[object String]';
}
