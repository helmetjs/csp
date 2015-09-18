var csp = require("..");

var _ = require("lodash");
var connect = require("connect");
var request = require("supertest");
var assert = require("assert");
var AGENTS = require("./browser-data");

describe("csp middleware", function () {
  var POLICY = {
    "default-src": ["'self'", "default.com"],
    "script-src": ["scripts.com"],
    "style-src": ["style.com"],
    "img-src": ["img.com"],
    "connect-src": ["connect.com"],
    "font-src": ["font.com"],
    "object-src": ["object.com"],
    "media-src": ["media.com"],
    "frame-src": ["frame.com"],
    "sandbox": ["allow-forms", "allow-scripts"],
    "report-uri": "/report-violation"
  };

  var CAMELCASE_POLICY = {
    defaultSrc: ["'self'", "default.com"],
    scriptSrc: ["scripts.com"],
    styleSrc: ["style.com"],
    imgSrc: ["img.com"],
    connectSrc: ["connect.com"],
    fontSrc: ["font.com"],
    objectSrc: ["object.com"],
    mediaSrc: ["media.com"],
    frameSrc: ["frame.com"],
    sandbox: ["allow-forms", "allow-scripts"],
    reportUri: "/report-violation"
  };

  function use (policy) {
    var result = connect();
    result.use(csp(policy));
    result.use(function (req, res) {
      res.end('Hello world!');
    });
    return result;
  }

  it("sets headers by string", function (done) {
    var app = use({ "default-src": "a.com b.biz" });
    request(app).get("/")
    .expect("Content-Security-Policy", /default-src a.com b.biz/, done);
  });

  it("sets all the headers if you tell it to", function (done) {
    var app = use({
      setAllHeaders: true,
      "default-src": ["'self'", "domain.com"]
    });
    request(app).get("/").set("User-Agent", AGENTS["Firefox 23"].string)
    .expect("X-Content-Security-Policy", /default-src 'self' domain.com/)
    .expect("Content-Security-Policy", /default-src 'self' domain.com/)
    .expect("X-WebKit-CSP", /default-src 'self' domain.com/)
    .end(done);
  });

  it("sets all the headers if you provide an unknown user-agent", function (done) {
    var app = use({ "default-src": ["'self'", "domain.com"] });
    request(app).get("/").set("User-Agent", "Burrito Browser")
    .expect("X-Content-Security-Policy", /default-src 'self' domain.com/)
    .expect("Content-Security-Policy", /default-src 'self' domain.com/)
    .expect("X-WebKit-CSP", /default-src 'self' domain.com/)
    .end(function(err) {
      if (err) { return done(err); }
      // unknown browser doesn't affect the next request
      request(app).get("/").set("User-Agent", AGENTS["Chrome 27"].string)
      .expect("Content-Security-Policy", /default-src 'self' domain.com/)
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
    .expect("X-Content-Security-Policy-Report-Only", /default-src 'self'/)
    .expect("Content-Security-Policy-Report-Only", /default-src 'self'/)
    .expect("X-WebKit-CSP-Report-Only", /default-src 'self'/)
    .end(done);
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
      csp({ "script-src": ["unsafe-eval"] });
    }, Error);
    assert.throws(function() {
      csp({ "default-src": "self" });
    }, Error);
    assert.throws(function() {
      csp({ "default-src": "self unsafe-inline" });
    }, Error);
  });

  it("throws an error reportOnly is true and there is no report-uri", function () {
    assert.throws(function() {
      csp({ reportOnly: true });
    }, Error);
  });

  _.each(AGENTS, function(agent, name) {

    if (agent.special) { return; }

    it("sets the header properly for " + name + " given dashed names", function (done) {
      var app = use(POLICY);
      var header = agent.header;
      request(app).get("/").set("User-Agent", agent.string)
      .expect(header, /default-src 'self' default.com/)
      .expect(header, /script-src scripts.com/)
      .expect(header, /img-src img.com/)
      .expect(header, /connect-src connect.com/)
      .expect(header, /font-src font.com/)
      .expect(header, /object-src object.com/)
      .expect(header, /media-src media.com/)
      .expect(header, /frame-src frame.com/)
      .expect(header, /sandbox allow-forms allow-scripts/)
      .expect(header, /report-uri \/report-violation/)
      .end(done);
    });

    it("sets the header properly for " + name + " given camelCased names", function (done) {
      var app = use(CAMELCASE_POLICY);
      var header = agent.header;
      request(app).get("/").set("User-Agent", agent.string)
      .expect(header, /default-src 'self' default.com/)
      .expect(header, /script-src scripts.com/)
      .expect(header, /img-src img.com/)
      .expect(header, /connect-src connect.com/)
      .expect(header, /font-src font.com/)
      .expect(header, /object-src object.com/)
      .expect(header, /media-src media.com/)
      .expect(header, /frame-src frame.com/)
      .expect(header, /sandbox allow-forms allow-scripts/)
      .expect(header, /report-uri \/report-violation/)
      .end(done);
    });

  });

  it("sets the header properly for Firefox 22", function (done) {
    var policy = _.extend({
      safari5: true
    }, POLICY);
    var app = use(policy);
    var header = "X-Content-Security-Policy";
    request(app).get("/").set("User-Agent", AGENTS["Firefox 22"].string)
    .expect(header, /default-src 'self' default.com/)
    .expect(header, /script-src scripts.com/)
    .expect(header, /img-src img.com/)
    .expect(header, /xhr-src connect.com/)
    .expect(header, /font-src font.com/)
    .expect(header, /object-src object.com/)
    .expect(header, /media-src media.com/)
    .expect(header, /frame-src frame.com/)
    .expect(header, /sandbox allow-forms allow-scripts/)
    .expect(header, /report-uri \/report-violation/)
    .end(done);
  });

  [
    "Safari 5.1",
    "Internet Explorer 8",
    "Internet Explorer 9",
    "Android 4.1.2"
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

  it("sets the header for Safari 5.1 if you force it", function (done) {
    var app = use({
      safari5: true,
      "default-src": "a.com"
    });
    request(app).get("/").set("User-Agent", AGENTS["Safari 5.1"].string)
    .expect("X-WebKit-CSP", "default-src a.com", done);
  });

  it("lets you disable Android", function (done) {
    var app = use({
      disableAndroid: true,
      "default-src": "a.com"
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

  [10, 11].forEach(function (version) {

    var ua = AGENTS["Internet Explorer " + version];

    it("sets the header for IE " + version + " if sandbox is true", function (done) {
      var app = use({ sandbox: true });
      request(app).get("/").set("User-Agent", ua.string)
      .expect(ua.header, "sandbox", done);
    });

    it("sets the header for IE " + version + " if sandbox is an array", function (done) {
      var app = use({ sandbox: ["allow-forms", "allow-scripts"] });
      request(app).get("/").set("User-Agent", ua.string)
      .expect(ua.header, /sandbox allow-forms allow-scripts/, done);
    });

    it("doesn't set the header for IE " + version + " if sandbox isn't specified", function (done) {
      var app = use({ "default-src": ["'self'"] });
      request(app).get("/").set("User-Agent", ua.string)
      .end(function (err, res) {
        if (err) {
          return done(err);
        }
        assert.equal(res.header[ua.header.toLowerCase()], undefined);
        done();
      });
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
    var app = use({ connectSrc: ["'self'"] });
    var iosChrome = AGENTS["iOS Chrome 40"];
    request(app).get("/").set("User-Agent", iosChrome.string)
    .expect(iosChrome.header, /connect-src 'self'/)
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
