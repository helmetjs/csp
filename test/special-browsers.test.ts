import connect from 'connect';
import request from 'supertest';
import { IncomingMessage, ServerResponse } from 'http';

import parseCsp from 'content-security-policy-parser';

import AGENTS from './browser-data.json';

import csp = require('..');

function makeApp (middleware: ReturnType<typeof csp>) {
  const result = connect();
  result.use(middleware);
  result.use((_req: IncomingMessage, res: ServerResponse) => {
    res.end('Hello world!');
  });
  return result;
}

describe('special browsers', () => {
  describe('Firefox 4', () => {
    const userAgentString = AGENTS['Firefox 4'].string;

    it('sets the header properly', async () => {
      const app = makeApp(csp({
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ['connect.com'],
        },
      }));

      const res = await request(app)
        .get('/')
        .set('User-Agent', userAgentString);

      expect(parseCsp(res.header['x-content-security-policy'])).toStrictEqual({
        allow: ["'self'"],
        'xhr-src': ['connect.com'],
      });
    });

    it("doesn't mutate directives for future requests (tests an old bug)", async () => {
      const app = makeApp(csp({
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ['connect.com'],
        },
      }));

      await request(app)
        .get('/')
        .set('User-Agent', userAgentString);

      const res = await request(app)
        .get('/')
        .set('User-Agent', AGENTS['Firefox 53'].string);

      expect(parseCsp(res.header['content-security-policy'])).toStrictEqual({
        'default-src': ["'self'"],
        'connect-src': ['connect.com'],
      });
    });
  });

  [
    'Firefox 22',
    'Firefox OS 1.4',
    'Firefox for Android 24',
  ].forEach((browser) => {
    describe(browser, () => {
      it('sets the header properly', async () => {
        const app = makeApp(csp({
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ['connect.com'],
          },
        }));

        const res = await request(app)
          .get('/')
          .set('User-Agent', AGENTS[browser as keyof typeof AGENTS].string);

        expect(parseCsp(res.header['x-content-security-policy'])).toStrictEqual({
          'default-src': ["'self'"],
          'xhr-src': ['connect.com'],
        });
      });
    });
  });

  [
    'Safari 4.1',
    'Safari 5.1 on OS X',
    'Safari 5.1 on Windows Server 2008',
  ].forEach((browser) => {
    describe(browser, () => {
      it("doesn't set the header", (done) => {
        const app = makeApp(csp({
          directives: {
            defaultSrc: ["'self'"],
          },
        }));

        request(app).get('/').set('User-Agent', AGENTS[browser as keyof typeof AGENTS].string)
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
    });
  });

  describe('Android', () => {
    it('can be disabled', (done) => {
      const app = makeApp(csp({
        disableAndroid: true,
        directives: {
          defaultSrc: ['a.com'],
        },
      }));

      request(app).get('/').set('User-Agent', AGENTS['Android 4.4.3'].string)
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
  });
});
