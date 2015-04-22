var util = require("util");

module.exports = function shallowCopy(obj) {
  var result = {};
  Object.keys(obj).forEach(function(key) {
    if (util.isArray(obj[key])) {
      result[key] = obj[key].slice();
    } else {
      result[key] = obj[key];
    }
  });
  return result;
};
