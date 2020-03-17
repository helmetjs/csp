import connect, { NextFunction } from 'connect';
import request from 'supertest';
import { IncomingMessage, ServerResponse } from 'http';

import parseCsp from 'content-security-policy-parser';

import AGENTS from './browser-data.json';

import csp = require('..');

describe('csp middleware', () => {
  function makeApp (middleware: ReturnType<typeof csp>) {
    const result = connect();
    result.use(middleware);
    result.use((_req: IncomingMessage, res: ServerResponse) => {
      res.end('Hello world!');
    });
    return result;
  }


  it('can set all headers', (done) => {
    const app = makeApp(csp({
      setAllHeaders: true,
      directives: {
        defaultSrc: ["'self'", 'domain.com'],
      },
    }));

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('X-Content-Security-Policy', "default-src 'self' domain.com")
      .expect('Content-Security-Policy', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP', "default-src 'self' domain.com")
      .end(done);
  });

  it('sets all the headers if you provide an unknown user-agent', (done) => {
    const app = makeApp(csp({
      directives: {
        defaultSrc: ["'self'", 'domain.com'],
      },
    }));

    request(app).get('/').set('User-Agent', 'Burrito Browser')
      .expect('X-Content-Security-Policy', "default-src 'self' domain.com")
      .expect('Content-Security-Policy', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP', "default-src 'self' domain.com")
      .end(done);
  });

  it('sets all the headers if there is no user-agent', (done) => {
    const app = makeApp(csp({
      directives: {
        defaultSrc: ["'self'", 'domain.com'],
      },
    }));

    request(app).get('/').unset('User-Agent')
      .expect('X-Content-Security-Policy', "default-src 'self' domain.com")
      .expect('Content-Security-Policy', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP', "default-src 'self' domain.com")
      .end(done);
  });

  it('can set the report-only headers', (done) => {
    const app = makeApp(csp({
      reportOnly: true,
      setAllHeaders: true,
      directives: {
        'default-src': ["'self' domain.com"],
      },
    }));

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('X-Content-Security-Policy-Report-Only', "default-src 'self' domain.com")
      .expect('Content-Security-Policy-Report-Only', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP-Report-Only', "default-src 'self' domain.com")
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.header['content-security-policy']).toBeUndefined();
        expect(res.header['x-content-security-policy']).toBeUndefined();
        expect(res.header['x-webkit-csp']).toBeUndefined();

        done();
      });
  });

  it('can use a function to set the report-only headers to true', (done) => {
    const app = makeApp(csp({
      reportOnly () {
        return true;
      },
      setAllHeaders: true,
      directives: {
        'default-src': ["'self'"],
        'report-uri': '/reporter',
      },
    }));

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        const expected = {
          'default-src': ["'self'"],
          'report-uri': ['/reporter'],
        };

        expect(res.header['content-security-policy']).toBeUndefined();
        expect(res.header['x-content-security-policy']).toBeUndefined();
        expect(res.header['x-webkit-csp']).toBeUndefined();

        expect(parseCsp(res.header['content-security-policy-report-only'])).toStrictEqual(expected);
        expect(parseCsp(res.header['x-content-security-policy-report-only'])).toStrictEqual(expected);
        expect(parseCsp(res.header['x-webkit-csp-report-only'])).toStrictEqual(expected);

        done();
      });
  });

  it('can use a function to set the report-only headers to false', (done) => {
    const app = makeApp(csp({
      reportOnly() {
        return false;
      },
      setAllHeaders: true,
      directives: {
        'default-src': ["'self' domain.com"],
      },
    }));

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('X-Content-Security-Policy', "default-src 'self' domain.com")
      .expect('Content-Security-Policy', "default-src 'self' domain.com")
      .expect('X-WebKit-CSP', "default-src 'self' domain.com")
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(res.header['content-security-policy-report-only']).toBeUndefined();
        expect(res.header['x-content-security-policy-report-only']).toBeUndefined();
        expect(res.header['x-webkit-csp-report-only']).toBeUndefined();

        done();
      });
  });

  it('overrides existing headers', (done) => {
    const app = connect();

    app.use((_req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
      res.setHeader('Content-Security-Policy', 'overridden');
      next();
    });

    app.use(csp({
      directives: {
        defaultSrc: ["'self'"],
      },
    }));

    app.use((_req: IncomingMessage, res: ServerResponse) => {
      res.end('Hello world!');
    });

    request(app).get('/').set('User-Agent', AGENTS['Firefox 53'].string)
      .expect('Content-Security-Policy', "default-src 'self'")
      .end(done);
  });

  it("doesn't splice the original array", async () => {
    const app = makeApp(csp({
      directives: {
        'style-src': [
          "'self'",
          "'unsafe-inline'",
        ],
      },
    }));
    const chrome = AGENTS['Chrome 27'];
    const firefox = AGENTS['Firefox 22'];

    await request(app).get('/').set('User-Agent', chrome.string)
      .expect(chrome.header, /style-src 'self' 'unsafe-inline'/);

    await request(app).get('/').set('User-Agent', firefox.string)
      .expect('X-Content-Security-Policy', /style-src 'self' 'unsafe-inline'/);

    await request(app).get('/').set('User-Agent', chrome.string)
      .expect(chrome.header, /style-src 'self' 'unsafe-inline'/);
  });

  it('allows you to disable directives with a false value', (done) => {
    const app = makeApp(csp({
      directives: {
        'style-src': ['example.com'],
        'script-src': false,
      },
    }));

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .expect('Content-Security-Policy', 'style-src example.com')
      .end(done);
  });

  it('names its function and middleware', () => {
    const policy = {
      defaultSrc: ["'self'"],
    };

    expect(csp.name).toStrictEqual('csp');
    expect(csp({ directives: policy }).name).toStrictEqual('csp');
  });
});
