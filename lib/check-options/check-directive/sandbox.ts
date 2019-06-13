import config from '../../config';
import isFunction from '../../is-function';

// TODO: type `any`
export = function sandboxCheck (key: string, value: any) {
  if (value === false) { return; }
  if (value === true) { return; }

  if (!Array.isArray(value)) {
    throw new Error(`"${ value }" is not a valid value for ${ key }. Use an array of strings or \`true\`.`);
  }

  if (value.length === 0) {
    throw new Error(`${key } must have at least one value. To block everything, set ${ key } to \`true\`.`);
  }

  value.forEach((expression) => {
    if (isFunction(expression)) { return; }

    if (config.sandboxDirectives.indexOf(expression) === -1) {
      throw new Error(`"${ expression }" is not a valid ${ key } directive. Remove it.`);
    }
  });
};
