var csp = require("..");

var _ = require("lodash");
var connect = require("connect");
var request = require("supertest");
var assert = require("assert");
var AGENTS = require("./browser-data");

describe("csp middleware", function () {
  var POLICY = {
    baseUri: "*",
    "child-src": ["child.com"],
    connectSrc: ["connect.com"],
    "default-src": ["'self'"],
    fontSrc: ["font.com"],
    "form-action": ["formaction.com"],
    frameAncestors: ["frameancestor.com"],
    "frame-src": ["frame.com"],
    imgSrc: ["data:", "img.com"],
    "manifest-src": ["manifest.com"],
    mediaSrc: ["media.com"],
    "object-src": ["object.com"],
    pluginTypes: ["application/x-shockwave-flash"],
    "report-uri": "/report-violation",
    sandbox: [],
    "script-src": ["'unsafe-eval'", "scripts.com"],
    styleSrc: ["styles.com", "'unsafe-inline'"],
    "upgrade-insecure-requests": ""
  };

  var EXPECTED_POLICY = [
    "base-uri *; child-src child.com; connect-src connect.com; default-src ",
    "'self'; font-src font.com; form-action formaction.com; frame-ancestors ",
    "frameancestor.com; frame-src frame.com; img-src data: img.com; ",
    "manifest-src manifest.com; media-src media.com; object-src object.com; ",
    "plugin-types application/x-shockwave-flash; report-uri /report-violation; ",
    "sandbox; script-src 'unsafe-eval' scripts.com; style-src styles.com ",
    "'unsafe-inline'; upgrade-insecure-requests"
  ].join("");

  function use(policy) {
    var result = connect();
    result.use(csp(policy));
    result.use(function (req, res) {
      res.end("Hello world!");
    });
    return result;
  }

  it("sets headers by string", function (done) {
    var app = use({ "default-src": "a.com b.biz" });
    request(app).get("/")
    .expect("Content-Security-Policy", "default-src a.com b.biz", done);
  });

  it("sets all the headers if you tell it to", function (done) {
    var app = use({
      setAllHeaders: true,
      "default-src": ["'self'", "domain.com"]
    });
    request(app).get("/").set("User-Agent", AGENTS["Firefox 23"].string)
    .expect("X-Content-Security-Policy", "default-src 'self' domain.com")
    .expect("Content-Security-Policy", "default-src 'self' domain.com")
    .expect("X-WebKit-CSP", "default-src 'self' domain.com")
    .end(done);
  });

  it("sets all the headers if you provide an unknown user-agent", function (done) {
    var app = use({ "default-src": ["'self'", "domain.com"] });
    request(app).get("/").set("User-Agent", "Burrito Browser")
    .expect("X-Content-Security-Policy", "default-src 'self' domain.com")
    .expect("Content-Security-Policy", "default-src 'self' domain.com")
    .expect("X-WebKit-CSP", "default-src 'self' domain.com")
    .end(function(err) {
      if (err) { return done(err); }
      // unknown browser doesn't affect the next request
      request(app).get("/").set("User-Agent", AGENTS["Chrome 27"].string)
      .expect("Content-Security-Policy", "default-src 'self' domain.com")
      .expect(function(res) {
        assert(!res.get("X-Content-Security-Policy"));
        assert(!res.get("X-WebKit-CSP"));
      })
      .end(done);
    });
  });

  it("sets the report-only headers", function (done) {
    var app = use({
      reportOnly: true,
      setAllHeaders: true,
      "default-src": ["'self'"],
      "report-uri": "/reporter"
    });
    request(app).get("/").set("User-Agent", AGENTS["Firefox 23"].string)
    .expect("X-Content-Security-Policy-Report-Only", "default-src 'self'; report-uri /reporter")
    .expect("Content-Security-Policy-Report-Only", "default-src 'self'; report-uri /reporter")
    .expect("X-WebKit-CSP-Report-Only", "default-src 'self'; report-uri /reporter")
    .end(done);
  });

  it("can set empty directives", function (done) {
    var app = use({
      scriptSrc: [],
      sandbox: [""]
    });

    request(app).get("/").set("User-Agent", AGENTS["Firefox 23"].string)
    .end(function (err, res) {
      if (err) { return done(err); }

      var header = res.headers["content-security-policy"];
      var split = header.split(";").map(function (str) { return str.trim(); }).sort();

      assert.equal(split[0], "sandbox");
      assert.equal(split[1], "script-src");

      done();
    });
  });

  it("throws an error when directives need quotes", function () {
    assert.throws(function() {
      csp({ "default-src": ["none"] });
    }, Error);
    assert.throws(function() {
      csp({ "default-src": ["self"] });
    }, Error);
    assert.throws(function() {
      csp({ "script-src": ["unsafe-inline"] });
    }, Error);
    assert.throws(function() {
      csp({ scriptSrc: "unsafe-eval" });
    }, Error);
    assert.throws(function() {
      csp({ "style-src": ["unsafe-inline"] });
    }, Error);
    assert.throws(function() {
      csp({ styleSrc: "unsafe-eval" });
    }, Error);
    assert.throws(function() {
      csp({ "default-src": "self" });
    }, Error);
    assert.throws(function() {
      csp({ defaultSrc: "self unsafe-inline" });
    }, Error);
  });

  it("throws an error reportOnly is true and there is no report-uri", function () {
    assert.throws(function() {
      csp({ reportOnly: true });
    }, Error);
  });

  _.each(AGENTS, function(agent, name) {
    if (agent.special) { return; }

    it("sets the header properly for " + name, function (done) {
      var app = use(POLICY);
      var header = agent.header;
      request(app).get("/").set("User-Agent", agent.string)
      .expect(header, EXPECTED_POLICY)
      .end(done);
    });
  });

  it("sets the header properly for Firefox 22", function (done) {
    var app = use(POLICY);
    var header = "X-Content-Security-Policy";
    request(app).get("/").set("User-Agent", AGENTS["Firefox 22"].string)
    .expect(header, /default-src 'self'/)
    .expect(header, /xhr-src connect.com/)
    .end(done);
  });

  [
    "Safari 4.1",
    "Safari 5.1 on OS X",
    "Safari 5.1 on Windows Server 2008"
  ].forEach(function (browser) {
    it("doesn't set the property for " + browser + " by default", function (done) {
      var app = use(POLICY);
      request(app).get("/").set("User-Agent", AGENTS[browser].string)
      .end(function(err, res) {
        if (err) { return done(err); }
        assert.equal(res.header["x-webkit-csp"], undefined);
        assert.equal(res.header["content-security-policy"], undefined);
        assert.equal(res.header["x-content-security-policy"], undefined);
        done();
      });
    });
  });

  it("sets the header for Safari 4.1 if you force it", function (done) {
    var app = use({
      safari5: true,
      "default-src": "a.com"
    });
    request(app).get("/").set("User-Agent", AGENTS["Safari 4.1"].string)
    .expect("X-WebKit-CSP", "default-src a.com", done);
  });

  it("sets the header for Safari 5.1 if you force it", function (done) {
    var app = use({
      safari5: true,
      "default-src": "a.com"
    });
    request(app).get("/").set("User-Agent", AGENTS["Safari 5.1 on OS X"].string)
    .expect("X-WebKit-CSP", "default-src a.com", done);
  });

  it("lets you disable Android", function (done) {
    var app = use({
      disableAndroid: true,
      defaultSrc: "a.com"
    });
    request(app).get("/").set("User-Agent", AGENTS["Android 4.4.3"].string)
    .end(function(err, res) {
      if (err) { return done(err); }
      assert.equal(res.header["x-webkit-csp"], undefined);
      assert.equal(res.header["content-security-policy"], undefined);
      assert.equal(res.header["x-content-security-policy"], undefined);
      done();
    });
  });

  it("appends connect-src 'self' in iOS Chrome when connect-src is already defined", function (done) {
    var app = use(POLICY);
    var iosChrome = AGENTS["iOS Chrome 40"];
    request(app).get("/").set("User-Agent", iosChrome.string)
    .expect(iosChrome.header, /connect-src (?:'self' connect.com)|(?:connect.com 'self')/)
    .end(done);
  });

  it("adds connect-src 'self' in iOS Chrome when connect-src is undefined", function (done) {
    var app = use({ styleSrc: ["'self'"] });
    var iosChrome = AGENTS["iOS Chrome 40"];
    request(app).get("/").set("User-Agent", iosChrome.string)
    .expect(iosChrome.header, /connect-src 'self'/)
    .end(done);
  });

  it("does nothing in iOS Chrome if connect-src 'self' is defined", function (done) {
    var app = use({ connectSrc: ["somedomain.com", "'self'"] });
    var iosChrome = AGENTS["iOS Chrome 40"];
    request(app).get("/").set("User-Agent", iosChrome.string)
    .expect(iosChrome.header, "connect-src somedomain.com 'self'")
    .end(done);
  });

  it("doesn't splice the original array", function (done) {
    var app = use({
      "style-src": [
        "'self'",
        "'unsafe-inline'"
      ]
    });
    var chrome = AGENTS["Chrome 27"];
    var ff = AGENTS["Firefox 22"];
    request(app).get("/").set("User-Agent", chrome.string)
    .expect(chrome.header, /style-src 'self' 'unsafe-inline'/)
    .end(function() {
      request(app).get("/").set("User-Agent", ff.string)
      .expect(ff.header, /style-src 'self'/)
      .end(function() {
        request(app).get("/").set("User-Agent", chrome.string)
        .expect(chrome.header, /style-src 'self' 'unsafe-inline'/)
        .end(done);
      });
    });
  });

  it("names its function and middleware", function () {
    assert.equal(csp.name, "csp");
    assert.equal(csp().name, "csp");
  });
});
