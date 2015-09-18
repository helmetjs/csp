Content Security Policy middleware
==================================

[![Build Status](https://travis-ci.org/helmetjs/csp.svg?branch=master)](https://travis-ci.org/helmetjs/csp)

Content Security Policy helps prevent unwanted content being injected into your webpages; this can mitigate XSS vulnerabilities, unintended frames, malicious frames, and more. If you want to learn how CSP works, check out the fantastic [HTML5 Rocks guide](http://www.html5rocks.com/en/tutorials/security/content-security-policy/), the [Content Security Policy Reference](http://content-security-policy.com/), and the [Content Security Policy specification](http://www.w3.org/TR/CSP/).

Usage:

```javascript
var csp = require('helmet-csp');

app.use(csp({
  // Specify directives as normal
  defaultSrc: ["'self'", 'default.com'],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ['style.com'],
  imgSrc: ['img.com', 'data:'],
  sandbox: ['allow-forms', 'allow-scripts'],
  reportUri: '/report-violation',

  // Set to an empty array to allow nothing through
  objectSrc: [],

  // Set to true if you only want browsers to report errors, not block them
  reportOnly: false,

  // Set to true if you want to blindly set all headers: Content-Security-Policy,
  // X-WebKit-CSP, and X-Content-Security-Policy.
  setAllHeaders: false,

  // Set to true if you want to disable CSP on Android.
  disableAndroid: false,

  // Set to true if you want to force buggy CSP in Safari 5.1 and below.
  safari5: false
}));
```

You can specify keys in a camel-cased fashion (`imgSrc`) or dashed (`img-src`); they are equivalent. The following directives are allowed:

* `baseUri`
* `childSrc`
* `connectSrc`
* `defaultSrc`
* `fontSrc`
* `formAction`
* `frameAncestors`
* `frameSrc`
* `imgSrc`
* `manifestSrc`
* `mediaSrc`
* `objectSrc`
* `pluginTypes`
* `reportUri`
* `sandbox`
* `scriptSrc`
* `styleSrc`
* `upgradeInsecureRequests`

There are a lot of inconsistencies in how browsers implement CSP. Helmet sniffs the user-agent of the browser and sets the appropriate header and value for that browser. If no user-agent is matched, it will set _all_ the headers with the 2.0 spec.

Handling CSP violations
-----------------------

If you've specified a `reportUri`, browsers will POST any CSP violations to your server. Here's a simple example of a route that handles those reports:

```js
// You need a JSON parser first.
app.use(bodyParser.json());

app.post('/report-violation', function (req, res) {
  if (req.body) {
    console.log('CSP Violation: ', req.body);
  } else {
    console.log('CSP Violation: No data received!');
  }
  res.status(204).end();
});
```

Not all browsers send CSP violations the same.

*Note*: If you're using a CSRF module like [csurf](https://github.com/expressjs/csurf), you might have problems handling these violations without a valid CSRF token. The fix is to put your CSP report route *above* csurf middleware.
