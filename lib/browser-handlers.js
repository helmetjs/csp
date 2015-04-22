var util = require("core-util-is");
var config = require("./config");
var shallowCopy = require("./shallow-copy");

var SET_NOTHING = { headers: [] };

var handlers = {};

handlers.default = function() {
  return { headers: config.allHeaders };
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
    return { headers: ["Content-Security-Policy"] };
  } else if ((version >= 4) && (version < 23)) {

    var policy = shallowCopy(directives);

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

handlers.Chrome = function(browser) {
  var version = parseFloat(browser.version);
  if ((version >= 14) && (version < 25)) {
    return { headers: ["X-WebKit-CSP"] };
  } else if (version >= 25) {
    return { headers: ["Content-Security-Policy"] };
  } else {
    return SET_NOTHING;
  }
};

handlers.Safari = function(browser, directives, options) {
  var version = parseFloat(browser.version);
  if (version >= 7) {
    return { headers: ["Content-Security-Policy"] };
  } else if ((version >= 6) || ((version >= 5.1) && options.safari5)) {
    return { headers: ["X-WebKit-CSP"] };
  } else {
    return SET_NOTHING;
  }
};

handlers.Opera = function(browser) {
  if (parseFloat(browser.version) >= 15) {
    return { headers: ["Content-Security-Policy"] };
  } else {
    return SET_NOTHING;
  }
};

handlers["Android Browser"] = function(browser, directives, options) {
  if ((parseFloat(browser.os.version) < 4.4) || options.disableAndroid) {
    return SET_NOTHING;
  } else {
    return { headers: ["Content-Security-Policy"] };
  }
};

handlers["Chrome Mobile"] = function(browser, directives) {
  if (browser.os.family === "iOS") {
    var result = { headers: ["Content-Security-Policy"] };
    var connect = directives["connect-src"];
    if (!connect) {
      result.directives = shallowCopy(directives);
      result.directives["connect-src"] = ["'self'"];
    } else if (connect.indexOf("'self'") === -1) {
      result.directives = shallowCopy(directives);
      result.directives["connect-src"].push("'self'");
    }
    return result;
  } else {
    return handlers["Android Browser"].apply(this, arguments);
  }
};

module.exports = handlers;
