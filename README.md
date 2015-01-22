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

*Note*: If you're using the `reportUri` feature and you're using [csurf](https://github.com/expressjs/csurf), you might have errors. [Check this out](https://github.com/expressjs/csurf/issues/20) for a workaround.
