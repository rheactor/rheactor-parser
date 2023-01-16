import { hasCircularPath } from "@/Helper";
import { getKeywordName } from "./Helper";

describe("Helper functions", () => {
  test("getKeywordName", () => {
    expect(getKeywordName("example")).toBe("example");
    expect(getKeywordName(Symbol("example"))).toBe("example");
    expect(getKeywordName(Symbol(123))).toBe("123");

    // eslint-disable-next-line symbol-description
    expect(getKeywordName(Symbol())).toBe("Symbol()");
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
