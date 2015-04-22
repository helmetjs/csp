var util = require("core-util-is");

var config = require("./config");

function parseValue(key, value) {

  var result;

  if (key === "sandbox" && value === true) {
    result = [];
  } else if (util.isString(value)) {
    result = value.split(/\s/g);
  } else if (!Array.isArray(value)) {
    throw new Error("Invalid directive: " + key + " " + value + ".");
  } else {
    result = value;
  }

  result.forEach(function(innerValue) {
    if (config.mustBeQuoted.indexOf(innerValue) !== -1) {
      throw new Error(innerValue + " must be quoted.");
    }
  });

  return result;

}

module.exports = function parseDirectivesFromOptions(options) {

  var result = {};

  for (var i = 0; i < config.directives.length; i ++) {

    var dashed = config.directives[i];
    var cameled = config.camelDirectives[i];
    if (options[dashed] && options[cameled] && (dashed !== cameled)) {
      throw new Error(dashed + " and " + cameled + " specified; specify just one.");
    }

    var value = options[dashed] || options[cameled];
    if (!value) { continue; }

    result[dashed] = parseValue(dashed, value);

  }

  return result;

};
