import connect, { NextFunction } from 'connect';
import request from 'supertest';
import { IncomingMessage, ServerResponse } from 'http';

import parseCsp from 'content-security-policy-parser';

import AGENTS from './browser-data.json';

import csp = require('..');

const POLICY = {
  defaultSrc: ["'self'"],
  'script-src': ['scripts.biz'],
  styleSrc: [
    'styles.biz', function (_req: IncomingMessage, res: ServerResponse) {
      return (res as any).nonce;
    },
  ],
  objectSrc: ["'none'"],
  imgSrc: ['data:'],
};

const EXPECTED_POLICY = {
  'default-src': ["'self'"],
  'script-src': ['scripts.biz'],
  'style-src': ['styles.biz', 'abc123'],
  'object-src': ["'none'"],
  'img-src': ['data:'],
};

function makeApp (middleware: ReturnType<typeof csp>) {
  const result = connect();
  result.use((_req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    (res as any).nonce = 'abc123';
    next();
  });
  result.use(middleware);
  result.use((_req: IncomingMessage, res: ServerResponse) => {
    res.end('Hello world!');
  });
  return result;
}

describe('with browser sniffing disabled', () => {
  Object.entries(AGENTS).forEach(([name, agent]) => {
    it(`sets the header for ${name}`, (done) => {
      const app = makeApp(csp({
        browserSniff: false,
        directives: POLICY,
      }));

      request(app).get('/').set('User-Agent', agent.string)
        .end((err, res) => {
          if (err) { return done(err); }

          expect(parseCsp(res.header['content-security-policy'])).toStrictEqual(EXPECTED_POLICY);
          expect(res.header['x-content-security-policy']).toBeUndefined();
          expect(res.header['x-webkit-csp']).toBeUndefined();

          done();
        });
    });
  });

  it('can use the report-only header', (done) => {
    const app = makeApp(csp({
      browserSniff: false,
      reportOnly: true,
      directives: POLICY,
    }));

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(parseCsp(res.header['content-security-policy-report-only'])).toStrictEqual(EXPECTED_POLICY);
        expect(res.header['x-content-security-policy']).toBeUndefined();
        expect(res.header['x-webkit-csp']).toBeUndefined();

        done();
      });
  });

  it('can set all headers', (done) => {
    const app = makeApp(csp({
      browserSniff: false,
      setAllHeaders: true,
      directives: POLICY,
    }));

    request(app).get('/').set('User-Agent', AGENTS['Firefox 23'].string)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        expect(parseCsp(res.header['content-security-policy'])).toStrictEqual(EXPECTED_POLICY);
        expect(parseCsp(res.header['x-content-security-policy'])).toStrictEqual(EXPECTED_POLICY);
        expect(parseCsp(res.header['x-webkit-csp'])).toStrictEqual(EXPECTED_POLICY);

        done();
      });
  });
});
