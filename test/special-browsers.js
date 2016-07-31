var csp = require('..')

var assert = require('assert')
var express = require('express')
var parseCsp = require('content-security-policy-parser')
var request = require('supertest')
var AGENTS = require('./browser-data')

function makeApp (options) {
  var result = express()

  result.use(csp(options))

  result.use(function (req, res) {
    res.end('Hello world!')
  })

  return result
}

describe('special browsers', function () {
  describe('Firefox 22', function () {
    it('sets the header properly', function (done) {
      var app = makeApp({
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
  })

  ;[
    'Safari 4.1',
    'Safari 5.1 on OS X',
    'Safari 5.1 on Windows Server 2008'
  ].forEach(function (browser) {
    describe(browser, function () {
      it("doesn't set the header", function (done) {
        var app = makeApp({
          directives: {
            defaultSrc: ["'self'"]
          }
        })

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
  })

  describe('Android', function () {
    it('can be disabled', function (done) {
      var app = makeApp({
        disableAndroid: true,
        directives: {
          defaultSrc: ['a.com']
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
  })

  describe('iOS Chrome', function () {
    it("appends connect-src 'self' connect-src is already defined", function (done) {
      var app = makeApp({
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

    it("adds connect-src 'self' in when connect-src is not specified", function (done) {
      var app = makeApp({
        directives: {
          styleSrc: ["'self'"]
        }
      })
      var iosChrome = AGENTS['iOS Chrome 40']

      request(app).get('/').set('User-Agent', iosChrome.string)
        .expect(iosChrome.header, /connect-src 'self'/)
        .end(done)
    })

    it("does nothing if connect-src 'self' is already defined", function (done) {
      var app = makeApp({
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
