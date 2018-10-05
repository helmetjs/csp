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
  [
    'Firefox 22',
    'Firefox OS 1.4',
    'Firefox for Android 24'
  ].forEach(function (browser) {
    describe(browser, function () {
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

            assert.deepStrictEqual(parseCsp(res.headers['x-content-security-policy']), {
              'default-src': ["'self'"],
              'xhr-src': ['connect.com']
            })

            done()
          })
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

            assert.strictEqual(res.header['x-webkit-csp'], undefined)
            assert.strictEqual(res.header['content-security-policy'], undefined)
            assert.strictEqual(res.header['x-content-security-policy'], undefined)

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

          assert.strictEqual(res.header['x-webkit-csp'], undefined)
          assert.strictEqual(res.header['content-security-policy'], undefined)
          assert.strictEqual(res.header['x-content-security-policy'], undefined)

          done()
        })
    })
  })
})
