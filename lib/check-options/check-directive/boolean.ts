import isBoolean from '../../is-boolean';

export = function (key: string, value: unknown) {
  if (!isBoolean(value)) {
    throw new Error(`"${value}" is not a valid value for ${key}. Use \`true\` or \`false\`.`);
  }
}
