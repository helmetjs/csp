import camelize from 'camelize';

import config from '../lib/config';

import csp = require('..');
import { CspOptions } from '../lib/types';

const SOURCELIST_DIRECTIVES = [
  'base-uri',
  'child-src',
  'connect-src',
  'default-src',
  'font-src',
  'form-action',
  'frame-ancestors',
  'frame-src',
  'img-src',
  'manifest-src',
  'media-src',
  'object-src',
  'prefetch-src',
  'script-src',
  'style-src',
  'worker-src',
];
const SOURCELISTS_WITH_UNSAFES = ['script-src', 'style-src', 'worker-src'];
const SOURCELISTS_WITH_STRICT_DYNAMIC = ['default-src', 'script-src'];
const BOOLEAN_DIRECTIVES = ['block-all-mixed-content', 'upgrade-insecure-requests'];
const PLUGINTYPE_DIRECTIVES = ['plugin-types'];
const URI_DIRECTIVES = ['report-to', 'report-uri'];
const REQUIRESRIFOR_DIRECTIVES = ['require-sri-for'];
const SANDBOX_DIRECTIVES = ['sandbox'];

const NO_ARGUMENTS = Symbol('NO_ARGUMENTS');

function assertThrowsWithArg (arg: typeof NO_ARGUMENTS | CspOptions, expectedMessage: string) {
  expect(() => {
    if (arg === NO_ARGUMENTS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (csp as any)();
    } else {
      csp(arg);
    }
  }).toThrow(expectedMessage);
}

function assertThrowsWithDirective (directiveKey: string, directiveValue: unknown, expectedMessage: string) {
  const arg = {
    directives: {
      [directiveKey]: directiveValue,
    },
  };
  assertThrowsWithArg(arg, expectedMessage);
}

describe('with bad arguments', () => {
  describe('missing directives', () => {
    it('errors without arguments', () => {
      assertThrowsWithArg(NO_ARGUMENTS, 'csp must be called with an object argument. See the documentation.');
    });

    it('errors with non-objects', () => {
      [
        undefined,
        null,
        true,
        false,
        0,
        1,
        '',
        'str',
        [],
        [{ directives: {} }],
      ].forEach((arg) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assertThrowsWithArg(arg as any, 'csp must be called with an object argument. See the documentation.');
      });
    });

    it('errors with an object that has no "directives" key', () => {
      assertThrowsWithArg({}, 'csp must have at least one directive under the "directives" key. See the documentation.');
      assertThrowsWithArg({ reportOnly: true }, 'csp must have at least one directive under the "directives" key. See the documentation.');
    });

    it('errors with an empty directives object', () => {
      assertThrowsWithArg({ directives: {} }, 'csp must have at least one directive under the "directives" key. See the documentation.');
    });

    it('errors with an invalid directive type', () => {
      assertThrowsWithArg({
        directives: { 'invalid-directive': ['http://example.com'] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, '"invalid-directive" is an invalid directive. See the documentation for the supported list. Force this by enabling loose mode.');
    });
  });

  it('tests all directives', () => {
    const actualDirectives = Object.keys(config.directives);
    const expectedDirectives = [
      ...SOURCELIST_DIRECTIVES,
      ...BOOLEAN_DIRECTIVES,
      ...PLUGINTYPE_DIRECTIVES,
      ...URI_DIRECTIVES,
      ...REQUIRESRIFOR_DIRECTIVES,
      ...SANDBOX_DIRECTIVES,
    ];
    expect(actualDirectives.sort()).toStrictEqual(expectedDirectives.sort());
  });

  SOURCELIST_DIRECTIVES.forEach((directive) => {
    [directive, camelize(directive)].forEach((key) => {
      describe(`${key} directive, a source list`, () => {
        it('errors with an empty array', () => {
          assertThrowsWithDirective(key, [], `${directive} must have at least one value. To block everything, set ${directive} to ["'none'"].`);
        });

        it('errors with a non-array', () => {
          [
            null,
            undefined,
            true,
            {},
            '',
            'https://example.com',
            function () {},
          ].forEach((value) => {
            assertThrowsWithDirective(key, value, `"${value}" is not a valid value for ${directive}. Use an array of strings.`);
          });
        });

        it('errors with an array that contains non-numbers', () => {
          assertThrowsWithDirective(key, ['http://example.com', 69, 'https://example.com'], '"69" is not a valid source expression. Only non-empty strings are allowed.');
        });

        it('errors with unquoted values', () => {
          assertThrowsWithDirective(key, ['self'], `"self" must be quoted in ${directive}. Change it to "'self'" in your source list. Force this by enabling loose mode.`);
          assertThrowsWithDirective(key, ['none'], `"none" must be quoted in ${directive}. Change it to "'none'" in your source list. Force this by enabling loose mode.`);
          if (SOURCELISTS_WITH_UNSAFES.indexOf(directive) !== -1) {
            assertThrowsWithDirective(key, ['unsafe-inline'], `"unsafe-inline" must be quoted in ${directive}. Change it to "'unsafe-inline'" in your source list. Force this by enabling loose mode.`);
            assertThrowsWithDirective(key, ['unsafe-eval'], `"unsafe-eval" must be quoted in ${directive}. Change it to "'unsafe-eval'" in your source list. Force this by enabling loose mode.`);
          }
          if (SOURCELISTS_WITH_STRICT_DYNAMIC.indexOf(directive) !== -1) {
            assertThrowsWithDirective(key, ['strict-dynamic'], `"strict-dynamic" must be quoted in ${directive}. Change it to "'strict-dynamic'" in your source list. Force this by enabling loose mode.`);
          }
        });

        if (SOURCELISTS_WITH_UNSAFES.indexOf(directive) === -1) {
          it('errors when called with unsafe-inline or unsafe-eval', () => {
            assertThrowsWithDirective(key, ['unsafe-inline'], `"unsafe-inline" does not make sense in ${directive}. Remove it.`);
            assertThrowsWithDirective(key, ['unsafe-eval'], `"unsafe-eval" does not make sense in ${directive}. Remove it.`);
            assertThrowsWithDirective(key, ["'unsafe-inline'"], `"'unsafe-inline'" does not make sense in ${directive}. Remove it.`);
            assertThrowsWithDirective(key, ["'unsafe-eval'"], `"'unsafe-eval'" does not make sense in ${directive}. Remove it.`);
          });
        }

        if (SOURCELISTS_WITH_STRICT_DYNAMIC.indexOf(directive) === -1) {
          it('errors when called with strict-dynamic', () => {
            assertThrowsWithDirective(key, ['strict-dynamic'], `"strict-dynamic" does not make sense in ${directive}. Remove it.`);
            assertThrowsWithDirective(key, ["'strict-dynamic'"], `"'strict-dynamic'" does not make sense in ${directive}. Remove it.`);
          });
        }
      });
    });
  });

  BOOLEAN_DIRECTIVES.forEach((directive) => {
    [directive, camelize(directive)].forEach((key) => {
      describe(`${key} directive, a boolean`, () => {
        it('errors when called with non-boolean values', () => {
          [
            null,
            undefined,
            {},
            [],
            ['example.com'],
            123,
            '',
            'true',
            'false',
            [true],
          ].forEach((value) => {
            assertThrowsWithDirective(key, value, `"${value}" is not a valid value for ${directive}. Use \`true\` or \`false\`.`);
          });
        });
      });
    });
  });

  PLUGINTYPE_DIRECTIVES.forEach((directive) => {
    [directive, camelize(directive)].forEach((key) => {
      describe(`${key} directive`, () => {
        it('errors with an empty array', () => {
          assertThrowsWithDirective(key, [], `${directive} must have at least one value. To block everything, set ${directive} to ["'none'"].`);
        });

        it('errors with a non-array', () => {
          [
            null,
            undefined,
            true,
            {},
            '',
            'https://example.com',
            function () {},
          ].forEach((value) => {
            assertThrowsWithDirective(key, value, `"${value}" is not a valid value for ${directive}. Use an array of strings.`);
          });
        });

        it('errors when called with an array that contains non-strings', () => {
          assertThrowsWithDirective(key, ['application/x-shockwave-flash', 420], '"420" is not a valid plugin type. Only non-empty strings are allowed.');
        });

        it('errors with unquoted values', () => {
          assertThrowsWithDirective(key, ['none'], `"none" must be quoted in ${directive}. Change it to "'none'" in your source list. Force this by enabling loose mode.`);
        });

        it("errors when called with values that don't make sense, like 'self', 'unsafe-inline', and 'unsafe-eval'", () => {
          assertThrowsWithDirective(key, ['self'], `"self" does not make sense in ${directive}. Remove it.`);
          assertThrowsWithDirective(key, ['unsafe-inline'], `"unsafe-inline" does not make sense in ${directive}. Remove it.`);
          assertThrowsWithDirective(key, ['unsafe-eval'], `"unsafe-eval" does not make sense in ${directive}. Remove it.`);
          assertThrowsWithDirective(key, ["'self'"], `"'self'" does not make sense in ${directive}. Remove it.`);
          assertThrowsWithDirective(key, ["'unsafe-inline'"], `"'unsafe-inline'" does not make sense in ${directive}. Remove it.`);
          assertThrowsWithDirective(key, ["'unsafe-eval'"], `"'unsafe-eval'" does not make sense in ${directive}. Remove it.`);
        });
      });
    });
  });

  URI_DIRECTIVES.forEach((directive) => {
    [directive, camelize(directive)].forEach((key) => {
      describe(`${key} directive, a URI`, () => {
        it('errors when called with non-string values', () => {
          [
            null,
            undefined,
            {},
            { length: 0 },
            { length: 2 },
            [],
            ['example.com'],
            123,
            true,
            '',
          ].forEach((value) => {
            assertThrowsWithDirective(key, value, `"${value}" is not a valid value for ${directive}. Use a non-empty string.`);
          });
        });
      });
    });
  });

  expect(REQUIRESRIFOR_DIRECTIVES).toStrictEqual(['require-sri-for']);

  REQUIRESRIFOR_DIRECTIVES.forEach((directive) => {
    [directive, camelize(directive)].forEach((key) => {
      describe(`${key} directive, a require-sri-for`, () => {
        it('errors with an empty array', () => {
          assertThrowsWithDirective(key, [], 'require-sri-for must have at least one value. To require nothing, omit the directive.');
        });

        it('errors with a non-array', () => {
          [
            null,
            undefined,
            true,
            {},
            '',
            'script',
            function () {},
          ].forEach((value) => {
            assertThrowsWithDirective(key, value, `"${value}" is not a valid value for require-sri-for. Use an array of strings.`);
          });
        });

        it('errors when called with unsupported directives', () => {
          assertThrowsWithDirective(key, [undefined], '"undefined" is not a valid require-sri-for value. Remove it.');
          assertThrowsWithDirective(key, ['script', undefined], '"undefined" is not a valid require-sri-for value. Remove it.');
          assertThrowsWithDirective(key, ['style', 123], '"123" is not a valid require-sri-for value. Remove it.');
          assertThrowsWithDirective(key, ['style', 'self'], '"self" is not a valid require-sri-for value. Remove it.');
          assertThrowsWithDirective(key, ["'none'", 'script'], '"\'none\'" is not a valid require-sri-for value. Remove it.');
        });
      });
    });
  });

  describe('sandbox directive', () => {
    it('is the only directive of its type', () => {
      expect(SANDBOX_DIRECTIVES).toStrictEqual(['sandbox']);
    });

    it('errors with an empty array', () => {
      assertThrowsWithDirective('sandbox', [], 'sandbox must have at least one value. To block everything, set sandbox to `true`.');
    });

    it('errors when called with non-array values', () => {
      [
        null,
        undefined,
        {},
        '',
        0,
        1,
      ].forEach((value) => {
        assertThrowsWithDirective('sandbox', value, `"${value}" is not a valid value for sandbox. Use an array of strings or \`true\`.`);
      });
    });

    it('errors when called with unsupported directives', () => {
      assertThrowsWithDirective('sandbox', ['allow-forms', undefined], '"undefined" is not a valid sandbox directive. Remove it.');
      assertThrowsWithDirective('sandbox', ['allow-forms', 123], '"123" is not a valid sandbox directive. Remove it.');
      assertThrowsWithDirective('sandbox', ['allow-foo'], '"allow-foo" is not a valid sandbox directive. Remove it.');
      assertThrowsWithDirective('sandbox', ['self'], '"self" is not a valid sandbox directive. Remove it.');
      assertThrowsWithDirective('sandbox', ["'self'"], '"\'self\'" is not a valid sandbox directive. Remove it.');
      assertThrowsWithDirective('sandbox', ['none'], '"none" is not a valid sandbox directive. Remove it.');
      assertThrowsWithDirective('sandbox', ["'none'"], '"\'none\'" is not a valid sandbox directive. Remove it.');
    });
  });
});
