import { Parser } from "@/Parser";
import { ParserError } from "@/ParserError";

describe("Parser class", () => {
  test("no rule specified", () => {
    expect(() => new Parser().parse("")).toThrow("no rule specified");
  });

  test("rule only parser", () => {
    const parser = new Parser();

    parser.rule("statement", /test/);

    expect(parser.parse("test")).toBe("test");

    expect(() => parser.parse("none")).toThrow('unexpected "none" at offset 0');
    expect(() => parser.parse("test 123")).toThrow(
      'unexpected "123" at offset 5'
    );
    expect(() => parser.parse("test123")).toThrow(
      'unexpected "123" at offset 4'
    );
  });

  test("rule transform, returning 123", () => {
    const parser = new Parser();

    parser.rule("statement", /test/).transform(() => 123);

    expect(parser.parse("test")).toBe(123);
  });

  test("rule transform, returning own", () => {
    const parser = new Parser();

    parser.rule("statement", /test/).transform((own: string) => own);

    expect(parser.parse("test")).toBe("test");
  });

  test("rule transform, multiple groups", () => {
    const parser = new Parser();

    parser
      .rule("statement", [/((t)(e)(s)(t))/])
      .transform((test, t, e, s, t2) => {
        return [test, t, e, s, t2];
      });

    expect(parser.parse("test")).toStrictEqual(["test", "t", "e", "s", "t"]);
  });

  test("token is duplicated", () => {
    expect(() => {
      const parser = new Parser();

      parser.token("test");
      parser.token("test");
    }).toThrow('token "test" already defined');

    expect(() => new Parser().tokens("test", "test")).toThrow(
      'token "test" already defined'
    );
  });

  test("token must be declared before rules", () => {
    expect(() => {
      const parser = new Parser();

      parser.rule("a", [/./]);
      parser.token("b");
    }).toThrow('token "b" must be declared before rules');
  });

  test("rule is using identifier reserved for token", () => {
    expect(() => {
      const parser = new Parser();

      parser.token("test");
      parser.rule("test", []);
    }).toThrow('rule is using identifier "test" reserved for token');
  });

  test("rule does not have a valid identifier", () => {
    expect(() => new Parser().rule("123", /123/)).toThrow(
      'rule "123" does not have a valid identifier'
    );
  });

  test("parse with token", () => {
    const parser = new Parser();

    parser.token("test");
    parser.rule("initial", ["test"]);

    expect(parser.parse("test")).toBeUndefined();
  });

  test("parse with token, multiple terms", () => {
    const parser = new Parser();

    parser.token("test", ["test", "TEST", /123/]);
    parser.rule("initial", ["test"]);

    expect(parser.parse("test")).toBeUndefined();
    expect(parser.parse("TEST")).toBeUndefined();
    expect(parser.parse("123")).toBeUndefined();
  });

  test("parse with token, as symbol", () => {
    const parser = new Parser();
    const kwTest = Symbol("test");

    parser.token(kwTest, "test");
    parser.rule("initial", [kwTest]);

    expect(parser.parse("test")).toBeUndefined();
  });

  test("rule with an unknown term", () => {
    const parser = new Parser();

    parser.rule("initial", ["a"]);

    expect(() => parser.parse("a")).toThrow(
      'unknown term "a" at rule "initial"'
    );
  });

  test("rule with an unknown term, multiple implementations of rule", () => {
    const parser = new Parser();

    parser.rule("initial", ["a"]);
    parser.rule("initial", ["b"]);

    expect(() => parser.parse("a")).toThrow(
      'unknown term "a" at rule "initial[0]"'
    );
  });

  test("separator as default", () => {
    const parser = new Parser();

    parser.token("a");
    parser.rule("initial", ["a", "a"]);

    expect(parser.parse("a a")).toBeUndefined();
    expect(parser.parse("aa")).toBeUndefined();
  });

  test("separator as non-whitespace", () => {
    const parser = new Parser();

    parser.separator(/-/);
    parser.token("a");
    parser.rule("initial", ["a", "a"]);

    expect(parser.parse("a-a")).toBeUndefined();
    expect(parser.parse("aa")).toBeUndefined();
    expect(() => parser.parse("a--a")).toThrow('unexpected "-" at offset 2');
    expect(() => parser.parse("a a")).toThrow('unexpected " " at offset 1');
  });

  test("rule strict must not accept separator between terms", () => {
    const parser = new Parser();

    parser.token("a");
    parser.ruleStrict("initial", ["a", "a"]);

    expect(parser.parse("aa")).toBeUndefined();
    expect(() => parser.parse("a a")).toThrow('unexpected " " at offset 1');
  });

  test("rule separated must requires all terms be separated", () => {
    const parser = new Parser();

    parser.token("a");
    parser.ruleSeparated("initial", ["a", "a"]);

    expect(parser.parse("a a")).toBeUndefined();
    expect(() => parser.parse("aa")).toThrow('unexpected "a" at offset 1');
  });

  test("rule nullable", () => {
    const parser = new Parser();

    parser.token("a");
    parser.rule("initial", null);

    expect(parser.parse("")).toBeNull();
  });

  test("rule with null alternative", () => {
    const parser = new Parser();

    parser.rule("initial", [/a/, "initial"]);
    parser.rule("initial", null);

    expect(parser.parse("aa")).toStrictEqual(["a", ["a", null]]);
  });

  test("rule non-nullable", () => {
    const parser = new Parser();

    parser.token("a");
    parser.rule("initial", ["a"]);

    expect(() => parser.parse("")).toThrow("unexpected empty input");
  });

  test("rule without terms", () => {
    const parser = new Parser();

    expect(() => parser.rule("initial", [])).toThrow(
      'rule "initial" must define at least one term'
    );
  });

  test("rule with same identifier must be sequential", () => {
    expect(() => {
      const parser = new Parser();

      parser.rule("first", "example");
      parser.rule("second", "example");
      parser.rule("first", "example");
    }).toThrow('rule "first" must be declared sequentially');
  });

  test("subrules", () => {
    const parser = new Parser();

    parser.token("a");
    parser.rule("initial", ["a", "subrule"]);
    parser.rule("subrule", ["a"]);

    expect(parser.parse("a a")).toBeUndefined();
    expect(parser.parse("aa")).toBeUndefined();
    expect(() => parser.parse("ab")).toThrow('unexpected "b" at offset 1');
  });

  test("subrules with default transformations", () => {
    const parser = new Parser({ ruleInitial: "initial" });

    parser.token("a");
    parser.rule("subrule", [/b/]);
    parser.rule("initial", ["a", "subrule"]);

    expect(parser.parse("a b")).toBe("b");
    expect(parser.parse("ab")).toBe("b");
    expect(() => parser.parse("ac")).toThrow('unexpected "c" at offset 1');
  });

  test("subrules with multiple matches", () => {
    const parser = new Parser();

    parser.token("a");
    parser
      .rule("initial", [/a/, "subrule"])
      .transform((a, [b, c, [d, e]]) => a + b + c + d + e);
    parser.rule("subrule", [/b/, /(c)/, /((d)(e))/]);

    expect(parser.parse("abcde")).toBe("abcde");
  });

  test("subrules with forced wrapper", () => {
    const parser = new Parser();

    parser.rule("initial", [/a/, "subrule"]);
    parser.rule("subrule", /b/).wrap();
    parser.rule("subrule", [/c/, /d/]);

    expect(parser.parse("ab")).toStrictEqual(["a", ["b"]]);
    expect(parser.parse("acd")).toStrictEqual(["a", ["c", "d"]]);
  });

  test("consume before and after separators", () => {
    const parser = new Parser();

    parser.rule("initial", [/a/, /a/]);

    expect(parser.parse(" aa ")).toStrictEqual(["a", "a"]);
    expect(parser.parse("aa ")).toStrictEqual(["a", "a"]);
    expect(parser.parse(" aa")).toStrictEqual(["a", "a"]);
  });

  test("consume zero token, that must not be confused with no match", () => {
    const parser = new Parser();

    parser.rule("initial", [/0/, /1/]);

    expect(parser.parse("01")).toStrictEqual(["0", "1"]);
  });

  test("consume zero rule, that must not be confused with no match", () => {
    const parser = new Parser();

    parser.token("0");
    parser.rule("initial", "0");

    expect(parser.parse("0")).toBeUndefined();
  });

  test("consume rule with optional content must capture whitespace", () => {
    const parser = new Parser();

    parser.rule("initial", [/0?/, /1/]);

    expect(parser.parse("1")).toStrictEqual(["", "1"]);
  });

  test("consume rule with optional content must capture whitespace, including next grouping term", () => {
    const parser = new Parser();

    parser.rule("initial", [/0?/, /(1)(2)/]);

    expect(parser.parse("12")).toStrictEqual(["", "1", "2"]);
  });

  test("consume rule with optional content must capture whitespace, including subrules", () => {
    const parser = new Parser();

    parser.rule("initial", [/0?/, "next"]);
    parser.rule("next", /1/);

    expect(parser.parse("1")).toStrictEqual(["", "1"]);
  });

  test("recursions must be avoided", () => {
    const parser = new Parser();

    parser.rule("initial", "initial");
    parser.rule("initial", /ok/);

    expect(parser.parse("ok")).toBe("ok");
  });

  test("recursions must be avoided, except if not first", () => {
    const parser = new Parser();

    parser.rule("initial", [/1/, "initial", "initial"]);
    parser.rule("initial", "initial");
    parser.rule("initial", /1/);

    expect(parser.parse("111")).toStrictEqual(["1", "1", "1"]);
  });

  test("recursions must be avoided, even when it is deeper", () => {
    const parser = new Parser();

    parser.rule("initial", "b");
    parser.rule("initial", /ok/);
    parser.rule("b", "c");
    parser.rule("c", "initial");

    expect(parser.parse("ok")).toBe("ok");
  });

  test("recursions must be avoided, but in some cases it is need", () => {
    const parser = new Parser();

    parser.tokens("+", "*");

    parser
      .rule("expression", ["term", "+", "expression"])
      .transform((a, b) => a + b);
    parser.rule("expression", "term");

    parser.rule("term", ["number", "*", "term"]).transform((a, b) => a * b);
    parser.rule("term", "number");

    parser.rule("number", /\d/).transform((d) => Number(d));

    expect(parser.parse("1+2")).toBe(3);
    expect(parser.parse("2*3")).toBe(6);
    expect(parser.parse("2*3+1")).toBe(7);
    expect(parser.parse("1+2*3")).toBe(7);
    expect(parser.parse("2*3+1+2")).toBe(9);
    expect(parser.parse("2*3+1+2*3")).toBe(13);
    expect(parser.parse("2*3+1+2*3+1")).toBe(14);
    expect(parser.parse("2*3*2+1+2*3+1")).toBe(20);
    expect(parser.parse("1+2*3+4+5*6*7+8+9")).toBe(238);
    expect(parser.parse("1*2*3*4*5*6*7*8*9")).toBe(362880);
  });

  test("recursions with sum but invalid", () => {
    const parser = new Parser();

    parser.token("+");

    parser.rule("sum", ["number", "+", "sum"]).transform((a, b) => a + b);
    parser.rule("number", /\d/).transform((d) => Number(d));

    expect(() => parser.parse("1")).toThrow('unexpected "1" at offset 0');
  });

  test("captures none-to-multiples groups", () => {
    const parser = new Parser();

    parser.rule("initial", [/(a)(b)/, /(c)d/, /e/]);

    expect(parser.parse("abcde")).toStrictEqual(["a", "b", "c", "e"]);
  });

  test("captures basic and grouped", () => {
    const parser = new Parser();

    parser.rule("initial", [/a/, /(b)(c)/]);

    expect(parser.parse("abc")).toStrictEqual(["a", "b", "c"]);
  });

  test("consume must fail if validation fails", () => {
    const parser = new Parser();

    // eslint-disable-next-line jest/no-conditional-in-test
    parser.rule("smallNumber", /\d+/).validate((n) => n >= 0 && n <= 1000);

    expect(parser.parse("0")).toBe("0");
    expect(parser.parse("1000")).toBe("1000");
    expect(() => parser.parse("5000")).toThrow('unexpected "5000" at offset 0');
  });

  test("consume must fail if validation fails, with custom message", () => {
    const parser = new Parser();

    parser.rule("example", [/abc/, "smallNumber"]);
    parser.rule("smallNumber", /\d+/).validate((n) =>
      // eslint-disable-next-line jest/no-conditional-in-test
      n >= 0 && n <= 1000 ? true : new Error("number too big")
    );

    expect(parser.parse("abc 0")).toStrictEqual(["abc", "0"]);
    expect(parser.parse("abc 1000")).toStrictEqual(["abc", "1000"]);

    const expectedError = new ParserError("number too big");

    expectedError.offset = 4;
    expectedError.unexpectedMessage = 'unexpected "5000"';

    try {
      parser.parse("abc 5000");
    } catch (e) {
      /* eslint-disable */
      expect(e).toBeInstanceOf(ParserError);

      if (e instanceof ParserError) {
        expect(e.offset).toBe(4);
        expect(e.unexpectedMessage).toBe('unexpected "5000"');
      }
      /* eslint-enable */
    }
  });

  test("transformation must occur only once, if validated", () => {
    expect.assertions(2);

    const parser = new Parser();

    parser
      .rule("smallNumber", /\d+/)
      .transform((n) => {
        expect(true).toBe(true);

        return Number(n);
      })
      // eslint-disable-next-line jest/no-conditional-in-test
      .validate((n) => typeof n === "number" && n >= 0 && n <= 1000);

    expect(parser.parse("0")).toBe(0);
  });

  test("ensure that the /.../i flag is maintained", () => {
    const parser = new Parser();

    // eslint-disable-next-line require-unicode-regexp
    parser.rule("expression", /example/i);

    expect(parser.parse("example")).toBe("example");
    expect(parser.parse("EXAMPLE")).toBe("EXAMPLE");
  });

  test("ensure that transformation happens on subrules", () => {
    const parser = new Parser();

    parser.rule("expression", "number").transform(Number);
    parser.rule("number", /\d+/);

    expect(parser.parse("123")).toBe(123);
  });

  test("ensure that transformation happens on subrules, multiple groups", () => {
    const parser = new Parser();

    parser
      .rule("expression", "number")
      .transform((a, b) => Number(a) + Number(b));
    parser.rule("number", /(\d)(\d)/);

    expect(parser.parse("46")).toBe(10);
  });

  test("ensure that optional tokens are considered consumed", () => {
    const parser = new Parser();

    parser.token(";", /;?/);
    parser.rule("example", [/example/, ";"]);

    expect(parser.parse("example")).toBe("example");
    expect(parser.parse("example;")).toBe("example");
  });

  test("transform must be applied if available, even if nothing was captured", () => {
    const parser = new Parser();

    parser.token(";");
    parser.rule("example", [/example/, "token"]);
    parser.rule("token", ";").transform(() => "fine");

    expect(parser.parse("example;")).toStrictEqual(["example", "fine"]);
  });

  test("ensure that validate() arguments are spread", () => {
    const parser = new Parser();

    parser.token("+");
    parser.rule("example", [/\d+/, "+", /abc/]).validate((n) =>
      // eslint-disable-next-line jest/no-conditional-in-test
      Number(n) < 1000 ? true : new Error("number must be lower than 1000")
    );

    expect(parser.parse("567 + abc")).toStrictEqual(["567", "abc"]);
    expect(() => parser.parse("12345 + abc")).toThrow(
      "number must be lower than 1000"
    );
  });
});

describe("README.me examples", () => {
  test("readme: basic example", () => {
    const parser = new Parser();

    parser.rule("example", /example/);

    expect(parser.parse("example")).toBe("example");
  });

  test("readme: regular expression capture", () => {
    const parser = new Parser();

    parser.rule("example", /(\d)\+(\d)/);

    expect(parser.parse("1+2")).toStrictEqual(["1", "2"]);
  });

  test("readme: regular expression capturing via groups", () => {
    const parser = new Parser();

    parser.rule("example", /((\d)\+(\d))/);

    expect(parser.parse("1+2")).toStrictEqual(["1+2", "1", "2"]);
  });

  test("readme: regular expression capturing a single group", () => {
    const parser = new Parser();

    parser.rule("example", /(\d)\+\d/);

    expect(parser.parse("1+2")).toBe("1");
  });

  test("readme: applying transform to sum values", () => {
    const parser = new Parser();

    parser
      .rule("example", /(\d)\+(\d)/)
      .transform((a, b) => Number(a) + Number(b));

    expect(parser.parse("1+2")).toBe(3);
  });

  test("readme: defining tokens, but receiving undefined?", () => {
    const parser = new Parser();

    parser.token("+");
    parser.token("digits", /\d+/);

    parser.rule("example", ["digits", "+", "digits"]);

    expect(parser.parse("1+2")).toBeUndefined();
  });

  test("readme: defining tokens on right way", () => {
    const parser = new Parser();

    parser.token("+");

    parser.rule("example", ["digits", "+", "digits"]);
    parser.rule("digits", /\d+/);

    expect(parser.parse("1+2")).toStrictEqual(["1", "2"]);
    expect(parser.parse("1 + 2")).toStrictEqual(["1", "2"]);
  });

  test("readme: defining multiple tokens", () => {
    const parser = new Parser();

    parser.tokens("+", "-");
    parser.token("*", "x");

    parser.rule("example", [/\d/, "+", /\d/, "-", /\d/, "*", /\d/]);

    expect(parser.parse("1+2-3x4")).toStrictEqual(["1", "2", "3", "4"]);
  });

  test("readme: defining a different separator", () => {
    const parser = new Parser();

    parser.separator(/-/);
    parser.rule("example", [/\d/, /\d/]);

    expect(parser.parse("1-2")).toStrictEqual(["1", "2"]);
  });

  test("readme: disable separator explicity", () => {
    const parser = new Parser();

    parser.separator(false);
    parser.rule("example", [/\d/, /\d/]);

    expect(() => parser.parse("1 2")).toThrow('unexpected " " at offset 1');
  });

  test("readme: strict or separated rules", () => {
    const parser = new Parser();

    parser.token("+");

    parser.ruleStrict("example", [/\d/, "+", /\d/]);
    parser.ruleSeparated("example", [/\d/, "+", /\d/]);

    expect(parser.parse("1+2")).toStrictEqual(["1", "2"]);
    expect(parser.parse("1 + 2")).toStrictEqual(["1", "2"]);
    expect(() => parser.parse("1+ 2")).toThrow('unexpected " " at offset 2');
  });

  test("readme: recursive sum, bad definition", () => {
    const parser = new Parser();

    parser.token("+");

    parser.rule("sum", ["number", "+", "sum"]).transform((a, b) => a + b);
    parser.rule("number", /\d/).transform((d) => Number(d));

    expect(() => parser.parse("1+2+3+4+5")).toThrow(
      'unexpected "1" at offset 0'
    );
  });

  test("readme: recursive sum, fixed", () => {
    const parser = new Parser();

    parser.token("+");

    parser.rule("sum", ["number", "+", "sum"]).transform((a, b) => a + b);
    parser.rule("sum", ["number"]);
    parser.rule("number", /\d/).transform((d) => Number(d));

    expect(parser.parse("1+2+3+4+5")).toBe(15);
  });
});
