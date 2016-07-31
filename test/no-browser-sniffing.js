var csp = require('..')

var assert = require('assert')
var each = require('lodash/each')
var express = require('express')
var parseCsp = require('content-security-policy-parser')
var request = require('supertest')
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

var EXPECTED_POLICY = {
  'default-src': ["'self'"],
  'script-src': ['scripts.biz'],
  'style-src': ['styles.biz', 'abc123'],
  'object-src': ["'none'"],
  'img-src': ['data:']
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

describe('with browser sniffing disabled', function () {
  each(AGENTS, function (agent, name) {
    it('sets the header for ' + name, function (done) {
      var app = makeApp({
        browserSniff: false,
        directives: POLICY
      })

      request(app).get('/').set('User-Agent', agent.string)
        .end(function (err, res) {
          if (err) { return done(err) }

          assert.deepEqual(parseCsp(res.headers['content-security-policy']), EXPECTED_POLICY)
          assert.equal(res.headers['x-content-security-policy'], undefined)
          assert.equal(res.headers['x-webkit-csp'], undefined)

          done()
        })
    })
  })

  it('can use the report-only header', function (done) {
    var app = makeApp({
      browserSniff: false,
      reportOnly: true,
      directives: POLICY
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'])
      .end(function (err, res) {
        if (err) { return done(err) }

        assert.deepEqual(parseCsp(res.headers['content-security-policy-report-only']), EXPECTED_POLICY)
        assert.equal(res.headers['x-content-security-policy'], undefined)
        assert.equal(res.headers['x-webkit-csp'], undefined)

        done()
      })
  })

  it('can set all headers', function (done) {
    var app = makeApp({
      browserSniff: false,
      setAllHeaders: true,
      directives: POLICY
    })

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'])
      .end(function (err, res) {
        if (err) { return done(err) }

        assert.deepEqual(parseCsp(res.headers['content-security-policy']), EXPECTED_POLICY)
        assert.deepEqual(parseCsp(res.headers['x-content-security-policy']), EXPECTED_POLICY)
        assert.deepEqual(parseCsp(res.headers['x-webkit-csp']), EXPECTED_POLICY)

        done()
      })
  })
})
