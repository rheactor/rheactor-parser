import { Parser } from "@/Parser";

describe("Parser class", () => {
  test("no rule specified", () => {
    expect(() => new Parser().parse("")).toThrow("no rule specified");
  });

  test("rule only parser", () => {
    const parser = new Parser();

    parser.rule("statement", /test/u);

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

    parser.rule("statement", /test/u, () => 123);

    expect(parser.parse("test")).toBe(123);
  });

  test("rule transform, returning own", () => {
    const parser = new Parser();

    parser.rule("statement", /test/u, (own: string) => own);

    expect(parser.parse("test")).toBe("test");
  });

  test("rule transform, multiple groups", () => {
    const parser = new Parser();

    parser.rule("statement", [/((t)(e)(s)(t))/u], (test, t, e, s, t2) => {
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

    expect(() => {
      const parser = new Parser();

      parser.tokens("test", "test");
    }).toThrow('token "test" already defined');
  });

  test("token must be declared before rules", () => {
    expect(() => {
      const parser = new Parser();

      parser.rule("a", [/./u]);
      parser.token("b");
    }).toThrow('token "b" must be declared before rules');
  });

  test("rule is using name reserved name for token", () => {
    expect(() => {
      const parser = new Parser();

      parser.token("test");
      parser.rule("test", []);
    }).toThrow('rule is using name "test" reserved for token');
  });

  test("parse with token", () => {
    const parser = new Parser();

    parser.token("test");
    parser.rule("initial", ["test"]);

    expect(parser.parse("test")).toBeUndefined();
  });

  test("parse with token, multiple terms", () => {
    const parser = new Parser();

    parser.token("test", ["test", "TEST", /123/u]);
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

    parser.separator(/-/u);
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

    expect(parser.parse("")).toBeUndefined();
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
    const parser = new Parser("initial");

    parser.token("a");
    parser.rule("subrule", [/b/u]);
    parser.rule("initial", ["a", "subrule"]);

    expect(parser.parse("a b")).toBe("b");
    expect(parser.parse("ab")).toBe("b");
    expect(() => parser.parse("ac")).toThrow('unexpected "c" at offset 1');
  });

  test("subrules with multiple matches", () => {
    const parser = new Parser();

    parser.token("a");
    parser.rule(
      "initial",
      [/a/u, "subrule"],
      (a, [b, c, [d, e]]) => a + b + c + d + e
    );
    parser.rule("subrule", [/b/u, /(c)/u, /((d)(e))/u]);

    expect(parser.parse("abcde")).toBe("abcde");
  });

  test("consume before and after separators", () => {
    const parser = new Parser();

    parser.rule("initial", [/a/u, /a/u]);

    expect(parser.parse(" aa ")).toStrictEqual(["a", "a"]);
    expect(parser.parse("aa ")).toStrictEqual(["a", "a"]);
    expect(parser.parse(" aa")).toStrictEqual(["a", "a"]);
  });

  test("recursions must be avoided", () => {
    const parser = new Parser();

    parser.rule("initial", "initial");
    parser.rule("initial", /ok/u);

    expect(parser.parse("ok")).toBe("ok");
  });

  test("recursions must be avoided, except if not first", () => {
    const parser = new Parser();

    parser.rule("initial", [/1/u, "initial", "initial"]);
    parser.rule("initial", "initial");
    parser.rule("initial", /1/u);

    expect(parser.parse("111")).toStrictEqual(["1", "1", "1"]);
  });

  test("recursions must be avoided, even when it is deeper", () => {
    const parser = new Parser();

    parser.rule("initial", "b");
    parser.rule("initial", /ok/u);
    parser.rule("b", "c");
    parser.rule("c", "initial");

    expect(parser.parse("ok")).toBe("ok");
  });

  test("recursions must be avoided, but in some cases it is need", () => {
    const parser = new Parser();

    parser.tokens("+", "*");

    parser.rule("expression", ["term", "+", "expression"], (a, b) => a + b);
    parser.rule("expression", "term");

    parser.rule("term", ["number", "*", "term"], (a, b) => a * b);
    parser.rule("term", "number");

    parser.rule("number", /\d/u, (number: number) => Number(number));

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

  test("captures none-to-multiples groups", () => {
    const parser = new Parser();

    parser.rule("initial", [/(a)(b)/u, /(c)d/u, /e/u]);

    expect(parser.parse("abcde")).toStrictEqual(["a", "b", "c", "e"]);
  });

  test("captures basic and grouped", () => {
    const parser = new Parser();

    parser.rule("initial", [/a/u, /(b)(c)/u]);

    expect(parser.parse("abc")).toStrictEqual(["a", "b", "c"]);
  });
});

describe("README.me examples", () => {
  test("readme: basic example", () => {
    const parser = new Parser();

    parser.rule("example", /example/u);

    expect(parser.parse("example")).toBe("example");
  });

  test("readme: regular expression capture", () => {
    const parser = new Parser();

    parser.rule("example", /(\d)\+(\d)/u);

    expect(parser.parse("1+2")).toStrictEqual(["1", "2"]);
  });

  test("readme: regular expression capturing via groups", () => {
    const parser = new Parser();

    parser.rule("example", /((\d)\+(\d))/u);

    expect(parser.parse("1+2")).toStrictEqual(["1+2", "1", "2"]);
  });

  test("readme: regular expression capturing a single group", () => {
    const parser = new Parser();

    parser.rule("example", /(\d)\+\d/u);

    expect(parser.parse("1+2")).toBe("1");
  });

  test("readme: applying transform to sum values", () => {
    const parser = new Parser();

    parser.rule("example", /(\d)\+(\d)/u, (a, b) => Number(a) + Number(b));

    expect(parser.parse("1+2")).toBe(3);
  });

  test("readme: defining tokens, but receiving undefined?", () => {
    const parser = new Parser();

    parser.token("+");
    parser.token("digits", /\d+/u);

    parser.rule("example", ["digits", "+", "digits"]);

    expect(parser.parse("1+2")).toBeUndefined();
  });

  test("readme: defining tokens on right way", () => {
    const parser = new Parser();

    parser.token("+");

    parser.rule("example", ["digits", "+", "digits"]);
    parser.rule("digits", /\d+/u);

    expect(parser.parse("1+2")).toStrictEqual(["1", "2"]);
    expect(parser.parse("1 + 2")).toStrictEqual(["1", "2"]);
  });

  test("readme: defining multiple tokens", () => {
    const parser = new Parser();

    parser.tokens("+", "-");
    parser.token("*", "x");

    parser.rule("example", [/\d/u, "+", /\d/u, "-", /\d/u, "*", /\d/u]);

    expect(parser.parse("1+2-3x4")).toStrictEqual(["1", "2", "3", "4"]);
  });

  test("readme: defining a different separator", () => {
    const parser = new Parser();

    parser.separator(/-/u);
    parser.rule("example", [/\d/u, /\d/u]);

    expect(parser.parse("1-2")).toStrictEqual(["1", "2"]);
  });

  test("readme: disable separator explicity", () => {
    const parser = new Parser();

    parser.separator(false);
    parser.rule("example", [/\d/u, /\d/u]);

    expect(() => parser.parse("1 2")).toThrow('unexpected " " at offset 1');
  });

  test("readme: strict or separated rules", () => {
    const parser = new Parser();

    parser.token("+");

    parser.ruleStrict("example", [/\d/u, "+", /\d/u]);
    parser.ruleSeparated("example", [/\d/u, "+", /\d/u]);

    expect(parser.parse("1+2")).toStrictEqual(["1", "2"]);
    expect(parser.parse("1 + 2")).toStrictEqual(["1", "2"]);
    expect(() => parser.parse("1+ 2")).toThrow('unexpected " " at offset 2');
  });
});
