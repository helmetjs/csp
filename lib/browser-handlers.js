var _ = require("lodash");
var config = require("./config");

var SET_NOTHING = { headers: [] };

var handlers = {};

handlers.default = function(browser, directives) {
  return {
    headers: config.allHeaders,
    directives: directives
  };
};

handlers.IE = function(browser, directives) {
  if ((parseFloat(browser.version) >= 10) && directives.sandbox) {
    return {
      headers: ["X-Content-Security-Policy"],
      directives: { sandbox: directives.sandbox }
    };
  } else {
    return SET_NOTHING;
  }
};

handlers.Firefox = function(browser, directives) {

  var version = parseFloat(browser.version);

  if (version >= 23) {
    return {
      headers: ["Content-Security-Policy"],
      directives: directives
    };

  } else if ((version >= 4) && (version < 23)) {

    var policy = _.cloneDeep(directives);

    policy["default-src"] = policy["default-src"] || ["*"];

    Object.keys(policy).forEach(function (key) {
      var value = policy[key];
      if (key === "connect-src") {
        policy["xhr-src"] = value;
      } else if (key === "default-src") {
        if (version < 5) {
          policy.allow = value;
        } else {
          policy["default-src"] = value;
        }
      } else if (key !== "sandbox") {
        policy[key] = value;
      }

      var index;
      if ((index = policy[key].indexOf("'unsafe-inline'")) !== -1) {
        if (key === "script-src") {
          policy[key][index] = "'inline-script'";
        } else {
          policy[key].splice(index, 1);
        }
      }
      if ((index = policy[key].indexOf("'unsafe-eval'")) !== -1) {
        if (key === "script-src") {
          policy[key][index] = "'eval-script'";
        } else {
          policy[key].splice(index, 1);
        }
      }
    });

    return {
      headers: ["X-Content-Security-Policy"],
      directives: policy
    };

  } else {

    return SET_NOTHING;

  }

};

handlers.Chrome = function(browser, directives) {
  var version = parseFloat(browser.version);
  var result = { directives: directives };
  if ((version >= 14) && (version < 25)) {
    result.headers = ["X-WebKit-CSP"];
  } else if (version >= 25) {
    result.headers = ["Content-Security-Policy"];
  } else {
    result.headers = [];
  }
  return result;
};

handlers.Safari = function(browser, directives, options) {
  var version = parseFloat(browser.version);
  var result = { directives: directives };
  if (version >= 7) {
    result.headers = ["Content-Security-Policy"];
  } else if ((version >= 6) || ((version >= 5.1) && options.safari5)) {
    result.headers = ["X-WebKit-CSP"];
  } else {
    result = SET_NOTHING;
  }
  return result;
};

handlers.Opera = function(browser, directives) {
  var result = { directives: directives };
  if (parseFloat(browser.version) >= 15) {
    result.headers = ["Content-Security-Policy"];
  } else {
    result = SET_NOTHING;
  }
  return result;
};

handlers["Android Browser"] = function(browser, directives, options) {
  if ((parseFloat(browser.os.version) < 4.4) || options.disableAndroid) {
    return SET_NOTHING;
  } else {
    return {
      headers: ["Content-Security-Policy"],
      directives: directives
    };
  }
};
handlers["Chrome Mobile"] = handlers["Android Browser"];

module.exports = handlers;
