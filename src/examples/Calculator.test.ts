import { Calculator } from "@Examples/Calculator";

describe("Calculator example", () => {
  test("single number", () => {
    expect(Calculator.parse("1")).toBe(1);
    expect(Calculator.parse("-1")).toBe(-1);
  });

  test("sum", () => {
    expect(Calculator.parse("1 + 2")).toBe(3);
    expect(Calculator.parse("-1 + -2")).toBe(-3);
  });

  test("subtract", () => {
    expect(Calculator.parse("1 - 2")).toBe(-1);
    expect(Calculator.parse("-1 - -2")).toBe(1);
  });

  test("multiply", () => {
    expect(Calculator.parse("2 * 3")).toBe(6);
    expect(Calculator.parse("-2 * 3")).toBe(-6);
  });

  test("divide", () => {
    expect(Calculator.parse("8 / 4")).toBe(2);
    expect(Calculator.parse("1 / 0")).toBe(Infinity);
  });

  test("sum and multiply, respecting precedence", () => {
    expect(Calculator.parse("1 + 2 * 3")).toBe(7);
    expect(Calculator.parse("2 * 3 + 1")).toBe(7);
    expect(Calculator.parse("1 + 2 * 3 + 1")).toBe(8);
    expect(Calculator.parse("2 * 3 + 1 * 2")).toBe(8);
  });

  test("sum and multiply, respecting parens", () => {
    expect(Calculator.parse("(1) * 3")).toBe(3);
    expect(Calculator.parse("1 * (3)")).toBe(3);
    expect(Calculator.parse("(1 + 2) * 3")).toBe(9);
    expect(Calculator.parse("2 * (3 + 1)")).toBe(8);
    expect(Calculator.parse("(1 + 2) * (3 + 1)")).toBe(12);
    expect(Calculator.parse("2 * (3 + 1) * 2")).toBe(16);
  });
});
