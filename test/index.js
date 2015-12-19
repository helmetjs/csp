var csp = require('..')

var _ = require('lodash')
var parseCsp = require('content-security-policy-parser')
var connect = require('connect')
var request = require('supertest')
var assert = require('assert')
var AGENTS = require('./browser-data')

var POLICY = {
  defaultSrc: ["'self'"],
  'script-src': ['scripts.biz'],
  styleSrc: ['styles.biz', function (req) {
    return req.nonce
  }],
  objectSrc: [],
  imgSrc: 'data:'
}

var EXPECTED_POLICY = {
  'default-src': ["'self'"],
  'script-src': ['scripts.biz'],
  'style-src': ['styles.biz', 'abc123'],
  'object-src': [],
  'img-src': ['data:']
}

describe('csp middleware', function () {
  function use (options) {
    var result = connect()
    result.use(function (req, res, next) {
      req.nonce = 'abc123'
      next()
    })
    result.use(csp(options))
    result.use(function (req, res) {
      res.end('Hello world!')
    })
    return result
  }

  it('sets an empty header when passed no arguments', function (done) {
    var app = use()

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('Content-Security-Policy', '')
      .end(done)
  })

  it('sets an empty header when passed an empty object', function (done) {
    var app = use({})

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('Content-Security-Policy', '')
      .end(done)
  })

  it('sets an empty header when passed no directives', function (done) {
    var app = use({ directives: {} })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('Content-Security-Policy', '')
      .end(done)
  })

  it('sets all the headers if you tell it to', function (done) {
    var app = use({
      setAllHeaders: true,
      directives: {
        defaultSrc: ["'self'", 'domain.com']
      }
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('X-Content-Security-Policy', "default-src 'self' domain.com")
      .expect('Content-Security-Policy', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP', "default-src 'self' domain.com")
      .end(done)
  })

  it('sets all the headers if you provide an unknown user-agent', function (done) {
    var app = use({
      directives: {
        defaultSrc: ["'self'", 'domain.com']
      }
    })

    request(app).get('/').set('User-Agent', 'Burrito Browser')
      .expect('X-Content-Security-Policy', "default-src 'self' domain.com")
      .expect('Content-Security-Policy', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP', "default-src 'self' domain.com")
      .end(done)
  })

  it('sets all the headers if there is no user-agent', function (done) {
    var app = use({
      directives: {
        defaultSrc: ["'self'", 'domain.com']
      }
    })

    request(app).get('/').unset('User-Agent')
      .expect('X-Content-Security-Policy', "default-src 'self' domain.com")
      .expect('Content-Security-Policy', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP', "default-src 'self' domain.com")
      .end(done)
  })

  it('can set the report-only headers', function (done) {
    var app = use({
      reportOnly: true,
      setAllHeaders: true,
      directives: {
        'default-src': ["'self'"],
        'report-uri': '/reporter'
      }
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .end(function (err, res) {
        if (err) { return done(err) }

        var expected = {
          'default-src': ["'self'"],
          'report-uri': ['/reporter']
        }

        assert.equal(res.headers['content-security-policy'], undefined)
        assert.equal(res.headers['x-content-security-policy'], undefined)
        assert.equal(res.headers['x-webkit-csp'], undefined)

        assert.deepEqual(parseCsp(res.headers['content-security-policy-report-only']), expected)
        assert.deepEqual(parseCsp(res.headers['x-content-security-policy-report-only']), expected)
        assert.deepEqual(parseCsp(res.headers['x-webkit-csp-report-only']), expected)

        done()
      })
  })

  it('can set empty directives', function (done) {
    var app = use({
      directives: {
        scriptSrc: [],
        sandbox: ['']
      }
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .end(function (err, res) {
        if (err) { return done(err) }

        assert.deepEqual(parseCsp(res.headers['content-security-policy']), {
          'sandbox': [],
          'script-src': []
        })

        done()
      })
  })

  it('throws an error reportOnly is true and there is no report-uri', function () {
    assert.throws(function () {
      csp({ reportOnly: true })
    }, Error)
  })

  it("doesn't splice the original array", function (done) {
    var app = use({
      directives: {
        'style-src': [
          "'self'",
          "'unsafe-inline'"
        ]
      }
    })
    var chrome = AGENTS['Chrome 27']
    var ff = AGENTS['Firefox 22']

    request(app).get('/').set('User-Agent', chrome.string)
      .expect(chrome.header, /style-src 'self' 'unsafe-inline'/)
      .end(function () {
        request(app).get('/').set('User-Agent', ff.string)
          .expect(ff.header, /style-src 'self'/)
          .end(function () {
            request(app).get('/').set('User-Agent', chrome.string)
              .expect(chrome.header, /style-src 'self' 'unsafe-inline'/)
              .end(done)
          })
      })
  })

  it('names its function and middleware', function () {
    assert.equal(csp.name, 'csp')
    assert.equal(csp().name, 'csp')
  })

  describe('normal browsers', function () {
    _.each(AGENTS, function (agent, name) {
      if (agent.special) { return }

      it('sets the header properly for ' + name, function (done) {
        var app = use({ directives: POLICY })

        request(app).get('/').set('User-Agent', agent.string)
        .end(function (err, res) {
          if (err) { return done(err) }

          var header = agent.header.toLowerCase()
          assert.deepEqual(parseCsp(res.headers[header]), EXPECTED_POLICY)

          done()
        })
      })
    })
  })

  describe('special browsers', function () {
    it('sets the header properly for Firefox 22', function (done) {
      var app = use({
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ['connect.com']
        }
      })

      request(app).get('/').set('User-Agent', AGENTS['Firefox 22'].string)
      .end(function (err, res) {
        if (err) { return done(err) }

        assert.deepEqual(parseCsp(res.headers['x-content-security-policy']), {
          'default-src': ["'self'"],
          'xhr-src': ['connect.com']
        })

        done()
      })
    })

    ;[
      'Safari 4.1',
      'Safari 5.1 on OS X',
      'Safari 5.1 on Windows Server 2008'
    ].forEach(function (browser) {
      it("doesn't set the property for " + browser, function (done) {
        var app = use({ directives: POLICY })

        request(app).get('/').set('User-Agent', AGENTS[browser].string)
        .end(function (err, res) {
          if (err) { return done(err) }

          assert.equal(res.header['x-webkit-csp'], undefined)
          assert.equal(res.header['content-security-policy'], undefined)
          assert.equal(res.header['x-content-security-policy'], undefined)

          done()
        })
      })
    })

    it('lets you disable Android', function (done) {
      var app = use({
        disableAndroid: true,
        directives: {
          defaultSrc: 'a.com'
        }
      })

      request(app).get('/').set('User-Agent', AGENTS['Android 4.4.3'].string)
      .end(function (err, res) {
        if (err) { return done(err) }

        assert.equal(res.header['x-webkit-csp'], undefined)
        assert.equal(res.header['content-security-policy'], undefined)
        assert.equal(res.header['x-content-security-policy'], undefined)

        done()
      })
    })

    it("appends connect-src 'self' in iOS Chrome when connect-src is already defined", function (done) {
      var app = use({
        directives: {
          connectSrc: ['connect.com']
        }
      })
      var iosChrome = AGENTS['iOS Chrome 40']

      request(app).get('/').set('User-Agent', iosChrome.string)
      .end(function (err, res) {
        if (err) { return done(err) }

        var header = iosChrome.header.toLowerCase()
        var connectSrc = parseCsp(res.headers[header])['connect-src'].sort()
        assert.deepEqual(connectSrc, ["'self'", 'connect.com'])

        done()
      })
    })

    it("adds connect-src 'self' in iOS Chrome when connect-src is undefined", function (done) {
      var app = use({
        directives: {
          styleSrc: ["'self'"]
        }
      })
      var iosChrome = AGENTS['iOS Chrome 40']

      request(app).get('/').set('User-Agent', iosChrome.string)
      .expect(iosChrome.header, /connect-src 'self'/)
      .end(done)
    })

    it("does nothing in iOS Chrome if connect-src 'self' is defined", function (done) {
      var app = use({
        directives: {
          connectSrc: ['somedomain.com', "'self'"]
        }
      })
      var iosChrome = AGENTS['iOS Chrome 40']
      request(app).get('/').set('User-Agent', iosChrome.string)
      .expect(iosChrome.header, "connect-src somedomain.com 'self'")
      .end(done)
    })
  })
})
