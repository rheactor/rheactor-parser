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
      'unexpected " " at offset 4'
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

    parser.rule(
      "statement",
      [/((t)(e)(s)(t))/u],
      ([test, t, e, s, t2]: string[]) => [test, t, e, s, t2]
    );

    expect(parser.parse("test")).toStrictEqual(["test", "t", "e", "s", "t"]);
  });

  test("keyword is duplicated", () => {
    expect(() => {
      const parser = new Parser();

      parser.keyword("test");
      parser.keyword("test");
    }).toThrow('keyword "test" already defined');
  });

  test("keyword must be declared before rules", () => {
    expect(() => {
      const parser = new Parser();

      parser.rule("a", []);
      parser.keyword("b");
    }).toThrow('keyword "b" must be declared before rules');
  });

  test("rule is using name reserved name for keyword", () => {
    expect(() => {
      const parser = new Parser();

      parser.keyword("test");
      parser.rule("test", []);
    }).toThrow('rule is using name "test" reserved for keyword');
  });

  test("parse with keyword", () => {
    const parser = new Parser();

    parser.keyword("test");
    parser.rule("initial", ["test"]);

    expect(parser.parse("test")).toBeUndefined();
  });

  test("parse with keyword, multiple terms", () => {
    const parser = new Parser();

    parser.keyword("test", ["test", "TEST", /123/u]);
    parser.rule("initial", ["test"]);

    expect(parser.parse("test")).toBeUndefined();
    expect(parser.parse("TEST")).toBeUndefined();
    expect(parser.parse("123")).toBeUndefined();
  });

  test("parse with keyword, as symbol", () => {
    const parser = new Parser();
    const kwTest = Symbol("test");

    parser.keyword(kwTest, "test");
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

    parser.keyword("a");
    parser.rule("initial", ["a", "a"]);

    expect(parser.parse("a a")).toBeUndefined();
    expect(parser.parse("aa")).toBeUndefined();
    expect(() => parser.parse(" a a")).toThrow('unexpected " " at offset 0');
    expect(() => parser.parse("a a ")).toThrow('unexpected " " at offset 3');
  });

  test("separator as non-whitespace", () => {
    const parser = new Parser();

    parser.separator(/-/u);
    parser.keyword("a");
    parser.rule("initial", ["a", "a"]);

    expect(parser.parse("a-a")).toBeUndefined();
    expect(parser.parse("aa")).toBeUndefined();
    expect(() => parser.parse("a--a")).toThrow('unexpected "a" at offset 0');
    expect(() => parser.parse("a a")).toThrow('unexpected "a" at offset 0');
  });

  test("rule strict must not accept separator between terms", () => {
    const parser = new Parser();

    parser.keyword("a");
    parser.ruleStrict("initial", ["a", "a"]);

    expect(parser.parse("aa")).toBeUndefined();
    expect(() => parser.parse("a a")).toThrow('unexpected "a" at offset 0');
  });

  test("rule separated must requires all terms be separated", () => {
    const parser = new Parser();

    parser.keyword("a");
    parser.ruleSeparated("initial", ["a", "a"]);

    expect(parser.parse("a a")).toBeUndefined();
    expect(() => parser.parse("aa")).toThrow('unexpected "aa" at offset 0');
  });

  test("rule nullable", () => {
    const parser = new Parser();

    parser.keyword("a");
    parser.rule("initial", null);

    expect(parser.parse("")).toBeUndefined();
  });

  test("rule non-nullable", () => {
    const parser = new Parser();

    parser.keyword("a");
    parser.rule("initial", ["a"]);

    expect(() => parser.parse("")).toThrow("unexpected empty input");
  });

  test("subrules", () => {
    const parser = new Parser();

    parser.keyword("a");
    parser.rule("initial", ["a", "subrule"]);
    parser.rule("subrule", ["a"]);

    expect(parser.parse("a a")).toBeUndefined();
    expect(parser.parse("aa")).toBeUndefined();
    expect(() => parser.parse("ab")).toThrow('unexpected "b" at offset 1');
  });

  test("subrules with default transformations", () => {
    const parser = new Parser("initial");

    parser.keyword("a");
    parser.rule("subrule", [/b/u]);
    parser.rule("initial", ["a", "subrule"]);

    expect(parser.parse("a b")).toBe("b");
    expect(parser.parse("ab")).toBe("b");
    expect(() => parser.parse("ac")).toThrow('unexpected "c" at offset 1');
  });

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

    parser.rule("example", /(\d)\+(\d)/u, ([a, b]) => Number(a) + Number(b));

    expect(parser.parse("1+2")).toBe(3);
  });

  test("readme: defining keywords, but receiving undefined?", () => {
    const parser = new Parser();

    parser.keyword("+");
    parser.keyword("digits", /\d+/u);

    parser.rule("example", ["digits", "+", "digits"]);

    expect(parser.parse("1+2")).toBeUndefined();
  });

  test("readme: defining keywords on right way", () => {
    const parser = new Parser();

    parser.keyword("+");

    parser.rule("example", ["digits", "+", "digits"]);
    parser.rule("digits", /\d+/u);

    expect(parser.parse("1+2")).toStrictEqual(["1", "2"]);
    expect(parser.parse("1 + 2")).toStrictEqual(["1", "2"]);
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

    expect(() => parser.parse("1 2")).toThrow('unexpected "1" at offset 0');
  });

  test("readme: strict or separated rules", () => {
    const parser = new Parser();

    parser.keyword("+");

    parser.ruleStrict("example", [/\d/u, "+", /\d/u]);
    parser.ruleSeparated("example", [/\d/u, "+", /\d/u]);

    expect(parser.parse("1+2")).toStrictEqual(["1", "2"]);
    expect(parser.parse("1 + 2")).toStrictEqual(["1", "2"]);
    expect(() => parser.parse("1+ 2")).toThrow('unexpected "1" at offset 0');
  });
});
