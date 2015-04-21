
module.exports = function makePolicyString(directives) {
  return Object.keys(directives).map(function (value) {
  	return [value].concat(directives[value]).join(" ");
  }).join(";");
};
