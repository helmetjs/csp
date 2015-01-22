var camelize = require("camelize");

var config = {
  allHeaders: [
    "X-Content-Security-Policy",
    "Content-Security-Policy",
    "X-WebKit-CSP"
  ],
  directives: [
    "default-src",
    "script-src",
    "object-src",
    "img-src",
    "media-src",
    "frame-src",
    "font-src",
    "connect-src",
    "style-src",
    "report-uri",
    "sandbox"
  ],
  mustBeQuoted: [
    "none",
    "self",
    "unsafe-inline",
    "unsafe-eval"
  ]
};
config.camelDirectives = config.directives.map(camelize);

module.exports = config;
