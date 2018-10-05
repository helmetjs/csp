var csp = require('..')

var parseCsp = require('content-security-policy-parser')
var express = require('express')
var request = require('supertest')
var assert = require('assert')
var AGENTS = require('./browser-data')

var POLICY = {
  defaultSrc: ["'self'"],
  'script-src': ['scripts.biz'],
  styleSrc: ['styles.biz', function (req, res) {
    return res.locals.nonce
  }],
  objectSrc: ["'none'"],
  imgSrc: ['data:']
}

function makeApp (options) {
  var result = express()

  result.use(function (req, res, next) {
    res.locals.nonce = 'abc123'
    next()
  })

  result.use(csp(options))

  result.use(function (req, res) {
    res.end('Hello world!')
  })

  return result
}

describe('csp middleware', function () {
  it('can set all headers', function (done) {
    var app = makeApp({
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
    var app = makeApp({
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
    var app = makeApp({
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
    var app = makeApp({
      reportOnly: true,
      setAllHeaders: true,
      directives: {
        'default-src': ["'self' domain.com"]
      }
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('X-Content-Security-Policy-Report-Only', "default-src 'self' domain.com")
      .expect('Content-Security-Policy-Report-Only', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP-Report-Only', "default-src 'self' domain.com")
      .end(function (err, res) {
        if (err) { return done(err) }

        assert.strictEqual(res.headers['content-security-policy'], undefined)
        assert.strictEqual(res.headers['x-content-security-policy'], undefined)
        assert.strictEqual(res.headers['x-webkit-csp'], undefined)

        done()
      })
  })

  it('can use a function to set the report-only headers to true', function (done) {
    var app = makeApp({
      reportOnly: function (req, res) {
        return true
      },
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

        assert.strictEqual(res.headers['content-security-policy'], undefined)
        assert.strictEqual(res.headers['x-content-security-policy'], undefined)
        assert.strictEqual(res.headers['x-webkit-csp'], undefined)

        assert.deepStrictEqual(parseCsp(res.headers['content-security-policy-report-only']), expected)
        assert.deepStrictEqual(parseCsp(res.headers['x-content-security-policy-report-only']), expected)
        assert.deepStrictEqual(parseCsp(res.headers['x-webkit-csp-report-only']), expected)

        done()
      })
  })

  it('can use a function to set the report-only headers to false', function (done) {
    var app = makeApp({
      reportOnly: function (req, res) {
        return false
      },
      setAllHeaders: true,
      directives: {
        'default-src': ["'self' domain.com"]
      }
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('X-Content-Security-Policy', "default-src 'self' domain.com")
      .expect('Content-Security-Policy', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP', "default-src 'self' domain.com")
      .end(function (err, res) {
        if (err) { return done(err) }

        assert.strictEqual(res.headers['content-security-policy-report-only'], undefined)
        assert.strictEqual(res.headers['x-content-security-policy-report-only'], undefined)
        assert.strictEqual(res.headers['x-webkit-csp-report-only'], undefined)

        done()
      })
  })

  it('overrides existing headers', function (done) {
    var app = express()

    app.use(function (req, res, next) {
      res.setHeader('Content-Security-Policy', 'overridden')
      next()
    })

    app.use(csp({
      directives: {
        defaultSrc: ["'self'"]
      }
    }))

    app.use(function (req, res) {
      res.end('Hello world!')
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 53'].string)
      .expect('Content-Security-Policy', "default-src 'self'")
      .end(done)
  })

  it("doesn't splice the original array", function (done) {
    var app = makeApp({
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

  it('allows you to disable directives with a false value', function (done) {
    var app = makeApp({
      directives: {
        'style-src': ['example.com'],
        'script-src': false
      }
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('Content-Security-Policy', 'style-src example.com')
      .end(done)
  })

  it('names its function and middleware', function () {
    assert.strictEqual(csp.name, 'csp')
    assert.strictEqual(csp({ directives: POLICY }).name, 'csp')
  })
})
