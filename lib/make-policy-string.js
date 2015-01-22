var _ = require("lodash");

module.exports = function makePolicyString(directives) {
  return _.map(directives, function(value, key) {
    return [key].concat(value).join(" ");
  }).join(";");
};
