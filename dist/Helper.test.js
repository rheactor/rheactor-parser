"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helper_1 = require("@/Helper");
describe("Helper functions", () => {
    test("getTokenIdentifier", () => {
        expect((0, Helper_1.getTokenIdentifier)("example")).toBe("example");
        expect((0, Helper_1.getTokenIdentifier)(Symbol("example"))).toBe("example");
        expect((0, Helper_1.getTokenIdentifier)(Symbol(123))).toBe("123");
        // eslint-disable-next-line symbol-description
        expect((0, Helper_1.getTokenIdentifier)(Symbol())).toBe("Symbol()");
    });
    test("hasCircularPath", () => {
        expect((0, Helper_1.hasCircularPath)([])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["a"])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["a", "b"])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["a", "b", "a"])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["a", "b", "c"])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["a", "b", "c", "a"])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["a", "b", "c", "a", "b"])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["b", "c", "a", "b", "c"])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["c", "a", "b", "c"])).toBe(false);
        expect((0, Helper_1.hasCircularPath)(["a", "b", "c", "a", "b", "c"])).toBe(true);
        expect((0, Helper_1.hasCircularPath)(["a", "b", "a", "b", "a"])).toBe(true);
        expect((0, Helper_1.hasCircularPath)(["a", "b", "a", "b"])).toBe(true);
        expect((0, Helper_1.hasCircularPath)(["a", "a"])).toBe(true);
    });
});
