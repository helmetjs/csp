module.exports = function makePolicyString(directives) {
  return Object.keys(directives).map(function (key) {
    return [key].concat(directives[key]).join(" ");
  }).join(";");
};
