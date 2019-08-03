export = function isString (value?: unknown): value is string {
  return Object.prototype.toString.call(value) === '[object String]';
}
