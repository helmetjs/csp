Content Security Policy middleware
==================================

[![Build Status](https://travis-ci.org/helmetjs/csp.svg?branch=master)](https://travis-ci.org/helmetjs/csp)

Content Security Policy helps prevent unwanted content being injected into your webpages; this can mitigate XSS vulnerabilities, unintended frames, malicious frames, and more. If you want to learn how CSP works, check out the fantastic [HTML5 Rocks guide](http://www.html5rocks.com/en/tutorials/security/content-security-policy/), the [Content Security Policy Reference](http://content-security-policy.com/), and the [Content Security Policy specification](http://www.w3.org/TR/CSP/).

Usage:

```javascript
var csp = require('helmet-csp');

app.use(csp({
  defaultSrc: ["'self'", 'default.com'],
  scriptSrc: ['scripts.com'],
  styleSrc: ['style.com'],
  imgSrc: ['img.com'],
  connectSrc: ['connect.com'],
  fontSrc: ['font.com'],
  objectSrc: ['object.com'],
  mediaSrc: ['media.com'],
  frameSrc: ['frame.com'],
  sandbox: ['allow-forms', 'allow-scripts'],
  reportUri: '/report-violation',
  reportOnly: false, // set to true if you only want to report errors
  setAllHeaders: false, // set to true if you want to set all headers
  disableAndroid: false, // set to true to disable CSP on Android (can be flaky)
  safari5: false // set to true if you want to force buggy CSP in Safari 5
}));
```

You can specify keys in a camel-cased fashion (`imgSrc`) or dashed (`img-src`); they are equivalent.

There are a lot of inconsistencies in how browsers implement CSP. Helmet sniffs the user-agent of the browser and sets the appropriate header and value for that browser. If no user-agent is matched, it will set _all_ the headers with the 1.0 spec.

*Note*: If you're using the `reportUri` feature and you're using [csurf](https://github.com/expressjs/csurf), you might have errors. The fix is to simply put your report route above this middleware, just like anything you want to do before something else:

```js
// Report CSP violations
app.post('/csp', bodyParser.json(), function (req, res) {
  // TODO - requires production level logging
  if (req.body) {
    // Just send to debug to see if this is working
    debug('CSP Violation: ' + JSON.stringify(req.body));
  } else {
    debug('CSP Violation: No data received!');
  }
  res.status(204).end();
});

// after do all your normal stuff
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })
app.use(csurf())
// ...
```

This works with Safari on OSX Mavericks.  For some reason Chrome (Version 42.0.2311.135 (64-bit)) does not work.

Example output:

```
TPG:app CSP Violation: {"csp-report":{"document-uri":"http://localhost:3000/","referrer":"","violated-directive":"font-src 'self' https://themes.googleusercontent.com","original-policy":"default-src 'self';script-src 'self' 'unsafe-inline' http://ajax.googleapis.com https://ajax.googleapis.com http://www.google-analytics.com https://www.google-analytics.com;object-src 'none';img-src 'self' data: https://d1ir1l1v07ijd0.cloudfront.net/ http://chart.googleapis.com https://chart.googleapis.com http://www.google-analytics.com https://www.google-analytics.com;media-src 'self';frame-src 'none';font-src 'self' https://themes.googleusercontent.com;connect-src 'self' ws://127.0.0.1:35729/livereload;style-src 'self' 'unsafe-inline' http://fonts.googleapis.com https://fonts.googleapis.com;report-uri /csp;sandbox allow-same-origin allow-forms allow-scripts","blocked-uri":"http://fonts.gstatic.com"}} +6s
```

References:

* https://github.com/expressjs/csurf/issues/20
* https://mathiasbynens.be/notes/csp-reports
