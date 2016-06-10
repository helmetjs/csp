var config = require('./config')
var dasherize = require('dasherize')

var MUST_QUOTE = ['none', 'self', 'unsafe-inline', 'unsafe-eval']
var UNSAFES = ["'unsafe-inline'", 'unsafe-inline', "'unsafe-eval'", 'unsafe-eval']

module.exports = function (options) {
  if (!options) {
    throw new Error('csp must be called with arguments. See the documentation.')
  }

  var directives = options.directives

  var directivesExist = Object.prototype.toString.call(directives) === '[object Object]'
  if (!directivesExist || Object.keys(directives).length === 0) {
    throw new Error('csp must have at least one directive under the "directives" key. See the documentation.')
  }

  Object.keys(directives).forEach(function (directiveKey) {
    checkDirective(dasherize(directiveKey), directives[directiveKey], options)
  })
}

function checkDirective (key, value, options) {
  if (options.loose) { return }

  if (!config.directives.hasOwnProperty(key)) {
    throw new Error('"' + key + '" is an invalid directive. See the documentation for the supported list. Force this by enabling loose mode.')
  }

  var directiveInfo = config.directives[key]

  if (directiveInfo.type === 'sourceList') {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        throw new Error(key + ' must have at least one value. To block everything, set ' + key + ' to ["\'none\'"].')
      }

      value.forEach(function (sourceExpression) {
        if (!sourceExpression) {
          throw new Error('"' + sourceExpression + '" is not a valid source expression. Only non-empty strings are allowed.')
        }

        sourceExpression = sourceExpression.valueOf()

        if (typeof sourceExpression !== 'string') {
          throw new Error('"' + sourceExpression + '" is not a valid source expression. Only non-empty strings are allowed.')
        }

        if (!directiveInfo.hasUnsafes && (UNSAFES.indexOf(sourceExpression) !== -1)) {
          throw new Error('"' + sourceExpression + '" does not make sense in ' + key + '. Remove it.')
        }

        if (MUST_QUOTE.indexOf(sourceExpression) !== -1) {
          throw new Error('"' + sourceExpression + '" must be quoted in ' + key + '. Change it to "\'' + sourceExpression + '\'" in your source list. Force this by enabling loose mode.')
        }
      })
    } else if ((value !== false) && !(value instanceof Function)) {
      throw new Error('"' + value + '" is not a valid value for ' + key + '. Use an array of strings.')
    }
  }
}
