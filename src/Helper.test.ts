import { hasCircularPath } from "@/Helper";
import { getTokenIdentifier } from "./Helper";

describe("Helper functions", () => {
  test("getTokenIdentifier", () => {
    expect(getTokenIdentifier("example")).toBe("example");
    expect(getTokenIdentifier(Symbol("example"))).toBe("example");
    expect(getTokenIdentifier(Symbol(123))).toBe("123");

    // eslint-disable-next-line symbol-description
    expect(getTokenIdentifier(Symbol())).toBe("Symbol()");
  });

  test("hasCircularPath", () => {
    expect(hasCircularPath([])).toBe(false);
    expect(hasCircularPath(["a"])).toBe(false);
    expect(hasCircularPath(["a", "b"])).toBe(false);
    expect(hasCircularPath(["a", "b", "a"])).toBe(false);
    expect(hasCircularPath(["a", "b", "c"])).toBe(false);
    expect(hasCircularPath(["a", "b", "c", "a"])).toBe(false);
    expect(hasCircularPath(["a", "b", "c", "a", "b"])).toBe(false);
    expect(hasCircularPath(["b", "c", "a", "b", "c"])).toBe(false);
    expect(hasCircularPath(["c", "a", "b", "c"])).toBe(false);

    expect(hasCircularPath(["a", "b", "c", "a", "b", "c"])).toBe(true);
    expect(hasCircularPath(["a", "b", "a", "b", "a"])).toBe(true);
    expect(hasCircularPath(["a", "b", "a", "b"])).toBe(true);
    expect(hasCircularPath(["a", "a"])).toBe(true);
  });
});
