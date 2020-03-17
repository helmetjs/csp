export = function isBoolean (value?: unknown): value is boolean {
  return Object.prototype.toString.call(value) === '[object Boolean]';
}
