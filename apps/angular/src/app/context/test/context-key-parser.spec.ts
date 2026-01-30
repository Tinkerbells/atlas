/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { Parser } from '../contex-key';

function parseToStr(input: string): string {
  const parser = new Parser();

  const prints: string[] = [];

  const print = (...ss: string[]) => {
    ss.forEach((s) => prints.push(s));
  };

  const expr = parser.parse(input);
  if (expr === undefined) {
    if (parser.lexingErrors.length > 0) {
      print('Lexing errors:', '\n\n');
      parser.lexingErrors.forEach((lexingError) =>
        print(
          `Unexpected token '${lexingError.lexeme}' at offset ${lexingError.offset}. ${lexingError.additionalInfo}`,
          '\n',
        ),
      );
    }

    if (parser.parsingErrors.length > 0) {
      if (parser.lexingErrors.length > 0) {
        print('\n --- \n');
      }
      print('Parsing errors:', '\n\n');
      parser.parsingErrors.forEach((parsingError) =>
        print(`Unexpected '${parsingError.lexeme}' at offset ${parsingError.offset}.`, '\n'),
      );
    }
  } else {
    print(expr.serialize());
  }

  return prints.join('');
}

describe('Context Key Parser', () => {
  it(' foo', () => {
    const input = ' foo';
    expect(parseToStr(input)).toBe('foo');
  });

  it('!foo', () => {
    const input = '!foo';
    expect(parseToStr(input)).toBe('!foo');
  });

  it('foo =~ /bar/', () => {
    const input = 'foo =~ /bar/';
    expect(parseToStr(input)).toBe('foo =~ /bar/');
  });

  it(`foo || (foo =~ /bar/ && baz)`, () => {
    const input = `foo || (foo =~ /bar/ && baz)`;
    expect(parseToStr(input)).toBe('foo || baz && foo =~ /bar/');
  });

  it('foo || (foo =~ /bar/ || baz)', () => {
    const input = 'foo || (foo =~ /bar/ || baz)';
    expect(parseToStr(input)).toBe('baz || foo || foo =~ /bar/');
  });

  it(`(foo || bar) && (jee || jar)`, () => {
    const input = `(foo || bar) && (jee || jar)`;
    expect(parseToStr(input)).toBe(
      'bar && jar || bar && jee || foo && jar || foo && jee',
    );
  });

  it('foo && foo =~ /zee/i', () => {
    const input = 'foo && foo =~ /zee/i';
    expect(parseToStr(input)).toBe('foo && foo =~ /zee/i');
  });

  it('foo.bar==enabled', () => {
    const input = 'foo.bar==enabled';
    expect(parseToStr(input)).toBe(`foo.bar == 'enabled'`);
  });

  it(`foo.bar == 'enabled'`, () => {
    const input = `foo.bar == 'enabled'`;
    expect(parseToStr(input)).toBe(`foo.bar == 'enabled'`);
  });

  it('foo.bar:zed==completed - equality with no space', () => {
    const input = 'foo.bar:zed==completed';
    expect(parseToStr(input)).toBe(`foo.bar:zed == 'completed'`);
  });

  it('a && b || c', () => {
    const input = 'a && b || c';
    expect(parseToStr(input)).toBe('c || a && b');
  });

  it('fooBar && baz.jar && fee.bee<K-loo+1>', () => {
    const input = 'fooBar && baz.jar && fee.bee<K-loo+1>';
    expect(parseToStr(input)).toBe('baz.jar && fee.bee<K-loo+1> && fooBar');
  });

  it('foo.barBaz<C-r> < 2', () => {
    const input = 'foo.barBaz<C-r> < 2';
    expect(parseToStr(input)).toBe(`foo.barBaz<C-r> < 2`);
  });

  it('foo.bar >= -1', () => {
    const input = 'foo.bar >= -1';
    expect(parseToStr(input)).toBe('foo.bar >= -1');
  });

  it('foo.bar <= -1', () => {
    const input = 'foo.bar <= -1';
    expect(parseToStr(input)).toBe('foo.bar <= -1');
  });

  it(`key contains nbsp: view == vsc-packages-activitybar-folders && vsc-packages-folders-loaded`, () => {
    const input = `view == vsc-packages-activitybar-folders && vsc-packages-folders-loaded`;
    expect(parseToStr(input)).toBe(
      `vsc-packages-folders-loaded && view == 'vsc-packages-activitybar-folders'`,
    );
  });

  it('!cmake:hideBuildCommand && cmake:enableFullFeatureSet', () => {
    const input = '!cmake:hideBuildCommand \u0026\u0026 cmake:enableFullFeatureSet';
    expect(parseToStr(input)).toBe(
      'cmake:enableFullFeatureSet && !cmake:hideBuildCommand',
    );
  });

  it('!(foo && bar)', () => {
    const input = '!(foo && bar)';
    expect(parseToStr(input)).toBe('!bar || !foo');
  });

  it('!(foo && bar || boar) || deer', () => {
    const input = '!(foo && bar || boar) || deer';
    expect(parseToStr(input)).toBe('deer || !bar && !boar || !boar && !foo');
  });

  it(`!(!foo)`, () => {
    const input = `!(!foo)`;
    expect(parseToStr(input)).toBe('foo');
  });

  describe('controversial', () => {
    it(`debugState == "stopped"`, () => {
      const input = `debugState == "stopped"`;
      expect(parseToStr(input)).toBe(`debugState == '"stopped"'`);
    });

    it(` viewItem == VSCode WorkSpace`, () => {
      const input = ` viewItem == VSCode WorkSpace`;
      expect(parseToStr(input)).toBe(
        `Parsing errors:\n\nUnexpected 'WorkSpace' at offset 20.\n`,
      );
    });
  });

  describe('regex', () => {
    it(`resource =~ //foo/(barr|door/(Foo-Bar%20Templates|Soo%20Looo)|Web%20Site%Jjj%20Llll)(/.*)*$/`, () => {
      const input = `resource =~ //foo/(barr|door/(Foo-Bar%20Templates|Soo%20Looo)|Web%20Site%Jjj%20Llll)(/.*)*$/`;
      expect(parseToStr(input)).toBe(
        'resource =~ /\\/foo\\/(barr|door\\/(Foo-Bar%20Templates|Soo%20Looo)|Web%20Site%Jjj%20Llll)(\\/.*)*$/',
      );
    });

    it(`resource =~ /((/scratch/(?!update)(.*)/)|((/src/).*/)).*$/`, () => {
      const input = `resource =~ /((/scratch/(?!update)(.*)/)|((/src/).*/)).*$/`;
      expect(parseToStr(input)).toBe(
        'resource =~ /((\\/scratch\\/(?!update)(.*)\\/)|((\\/src\\/).*\\/)).*$/',
      );
    });

    it(`resourcePath =~ /\\.md(\\.yml|\\.txt)*$/giym`, () => {
      const input = `resourcePath =~ /\\.md(\\.yml|\\.txt)*$/giym`;
      expect(parseToStr(input)).toBe('resourcePath =~ /\\.md(\\.yml|\\.txt)*$/im');
    });
  });

  describe('error handling', () => {
    it(`/foo`, () => {
      const input = `/foo`;
      expect(parseToStr(input)).toBe(
        `Lexing errors:\n\nUnexpected token '/foo' at offset 0. Did you forget to escape the '/' (slash) character? Put two backslashes before it to escape, e.g., '\\\\/'.\n\n --- \nParsing errors:\n\nUnexpected '/foo' at offset 0.\n`,
      );
    });

    it(`!b == 'true'`, () => {
      const input = `!b == 'true'`;
      expect(parseToStr(input)).toBe(
        `Parsing errors:\n\nUnexpected '==' at offset 3.\n`,
      );
    });

    it('!foo &&  in bar', () => {
      const input = '!foo &&  in bar';
      expect(parseToStr(input)).toBe(
        `Parsing errors:\n\nUnexpected 'in' at offset 9.\n`,
      );
    });

    it('vim<c-r> == 1 && vim<2<=3', () => {
      const input = 'vim<c-r> == 1 && vim<2<=3';
      expect(parseToStr(input)).toBe(
        `Lexing errors:\n\nUnexpected token '=' at offset 23. Did you mean == or =~?\n\n --- \nParsing errors:\n\nUnexpected '=' at offset 23.\n`,
      );
    });

    it(`foo && 'bar`, () => {
      const input = `foo && 'bar`;
      expect(parseToStr(input)).toBe(
        `Lexing errors:\n\nUnexpected token ''bar' at offset 7. Did you forget to open or close the quote?\n\n --- \nParsing errors:\n\nUnexpected ''bar' at offset 7.\n`,
      );
    });

    it(`config.foo &&  &&bar =~ /^foo$|^bar-foo$|^joo$|^jar$/ && !foo`, () => {
      const input = `config.foo &&  &&bar =~ /^foo$|^bar-foo$|^joo$|^jar$/ && !foo`;
      expect(parseToStr(input)).toBe(
        `Parsing errors:\n\nUnexpected '&&' at offset 15.\n`,
      );
    });

    it(`!foo == 'test'`, () => {
      const input = `!foo == 'test'`;
      expect(parseToStr(input)).toBe(
        `Parsing errors:\n\nUnexpected '==' at offset 5.\n`,
      );
    });

    it(`!!foo`, function () {
      const input = `!!foo`;
      expect(parseToStr(input)).toBe(
        `Parsing errors:\n\nUnexpected '!' at offset 1.\n`,
      );
    });
  });
});
