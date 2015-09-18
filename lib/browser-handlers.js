var config = require("./config");
var shallowCopy = require("./shallow-copy");

var SET_NOTHING = { headers: [] };

var handlers = {};

handlers.default = function() {
  return { headers: config.allHeaders };
};

handlers.IE = function (browser) {
  var header = browser.version < 12 ? "X-Content-Security-Policy" : "Content-Security-Policy";
  return { headers: [header] };
};

handlers.Firefox = function(browser, directives) {

  var version = parseFloat(browser.version);

  if (version >= 23) {
    return { headers: ["Content-Security-Policy"] };
  } else if (version >= 4 && version < 23) {

    var policy = shallowCopy(directives);

    policy.defaultSrc = policy.defaultSrc || ["*"];

    Object.keys(policy).forEach(function (key) {
      var value = policy[key];
      if (key === "connectSrc") {
        policy.xhrSrc = value;
      } else if (key === "defaultSrc") {
        if (version < 5) {
          policy.allow = value;
        } else {
          policy.defaultSrc = value;
        }
      } else if (key !== "sandbox") {
        policy[key] = value;
      }

      var index;
      if ((index = policy[key].indexOf("'unsafe-inline'")) !== -1) {
        if (key === "scriptSrc") {
          policy[key][index] = "'inline-script'";
        } else {
          policy[key].splice(index, 1);
        }
      }
      if ((index = policy[key].indexOf("'unsafe-eval'")) !== -1) {
        if (key === "scriptSrc") {
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
  if (version >= 14 && version < 25) {
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
  } else if (version >= 6 || options.safari5) {
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
  if (parseFloat(browser.os.version) < 4.4 || options.disableAndroid) {
    return SET_NOTHING;
  } else {
    return { headers: ["Content-Security-Policy"] };
  }
};

handlers["Chrome Mobile"] = function(browser, directives) {
  if (browser.os.family === "iOS") {
    var result = { headers: ["Content-Security-Policy"] };
    var connect = directives.connectSrc || directives.connectSrc;
    if (!connect) {
      result.directives = shallowCopy(directives);
      result.directives.connectSrc = ["'self'"];
    } else if (connect.indexOf("'self'") === -1) {
      result.directives = shallowCopy(directives);
      result.directives.connectSrc.push("'self'");
    }
    return result;
  } else {
    return handlers["Android Browser"].apply(this, arguments);
  }
};

module.exports = handlers;
