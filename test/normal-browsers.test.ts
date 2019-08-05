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
  mediaSrc: false as false,
  prefetchSrc: ['prefetch.example.com'],
  reportTo: '/report',
  requireSriFor: ['script'],
  upgradeInsecureRequests: true,
};

const EXPECTED_POLICY = {
  'default-src': ["'self'"],
  'script-src': ['scripts.biz'],
  'style-src': ['styles.biz', 'abc123'],
  'object-src': ["'none'"],
  'img-src': ['data:'],
  'prefetch-src': ['prefetch.example.com'],
  'report-to': ['/report'],
  'require-sri-for': ['script'],
  'upgrade-insecure-requests': [],
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

describe('normal browsers', () => {
  Object.entries(AGENTS).forEach(([name, agent]) => {
    if (agent.special || !agent.header) {
      return;
    }

    const app = makeApp(csp({ directives: POLICY }));

    it(`sets the header properly for ${name}`, (done) => {
      request(app).get('/').set('User-Agent', agent.string)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }

          const header = agent.header.toLowerCase();
          expect(parseCsp(res.header[header])).toStrictEqual(EXPECTED_POLICY);

          done();
        });
    });

    it(`does not set other headers for ${name}`, (done) => {
      request(app).get('/').set('User-Agent', agent.string)
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }

          [
            'content-security-policy',
            'x-content-security-policy',
            'x-webkit-csp',
          ].forEach((header) => {
            if (header === agent.header.toLowerCase()) {
              return;
            }
            expect(res.header[header]).toBeUndefined();
          });

          done();
        });
    });
  });
});
