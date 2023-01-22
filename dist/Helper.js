"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MandatorySeparatorError = exports.hasCircularPath = exports.getTokenIdentifier = exports.isTokenIdentifier = exports.separatorWhitespace = exports.separatorToken = exports.matchIdentifier = exports.matchAny = exports.match = exports.isRegexpOptimizable = exports.regexpSticky = exports.RuleSeparatorMode = void 0;
var RuleSeparatorMode;
(function (RuleSeparatorMode) {
    RuleSeparatorMode[RuleSeparatorMode["OPTIONAL"] = 0] = "OPTIONAL";
    RuleSeparatorMode[RuleSeparatorMode["DISALLOWED"] = 1] = "DISALLOWED";
    RuleSeparatorMode[RuleSeparatorMode["MANDATORY"] = 2] = "MANDATORY";
})(RuleSeparatorMode = exports.RuleSeparatorMode || (exports.RuleSeparatorMode = {}));
const regexpSticky = (expression) => expression.sticky
    ? expression
    : new RegExp(expression, `y${expression.flags}`);
exports.regexpSticky = regexpSticky;
const TEXT_ONLY_REGEXP = /^[\w\s-]+$/u;
const isRegexpTextOnly = (string) => TEXT_ONLY_REGEXP.exec(string) !== null;
const isRegexpOptimizable = (expression) => !expression.ignoreCase && isRegexpTextOnly(expression.source);
exports.isRegexpOptimizable = isRegexpOptimizable;
const match = (regexp, input, at = 0) => {
    regexp.lastIndex = at;
    return regexp.exec(input);
};
exports.match = match;
exports.matchAny = exports.match.bind(null, /\d+|\w+|./uy);
const matchIdentifier = (input) => /^[a-z_][a-z0-9]*$/iu.test(input);
exports.matchIdentifier = matchIdentifier;
exports.separatorToken = Symbol("separator");
exports.separatorWhitespace = /\s+/u;
const isTokenIdentifier = (x) => typeof x === "string" || typeof x === "symbol";
exports.isTokenIdentifier = isTokenIdentifier;
const getTokenIdentifier = (token) => typeof token === "symbol" ? token.description ?? token.toString() : token;
exports.getTokenIdentifier = getTokenIdentifier;
const hasCircularPath = (path) => {
    if (path.length < 2) {
        return false;
    }
    const pathLastIndex = path.length - 1;
    const pathLast = path[pathLastIndex];
    const pathCircularIndex = path.lastIndexOf(pathLast, pathLastIndex - 1);
    if (pathCircularIndex === -1) {
        return false;
    }
    const sequenceLeft = path.slice(pathCircularIndex - (pathLastIndex - pathCircularIndex - 1), pathCircularIndex);
    const sequenceRight = path.slice(pathCircularIndex + 1, -1);
    return sequenceLeft.join() === sequenceRight.join();
};
exports.hasCircularPath = hasCircularPath;
class MandatorySeparatorError extends Error {
}
exports.MandatorySeparatorError = MandatorySeparatorError;
