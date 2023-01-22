"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserConsumerResult = void 0;
class ParserConsumerResult {
    rule;
    offset;
    matches;
    constructor(rule, offset, matches) {
        this.rule = rule;
        this.offset = offset;
        this.matches = matches;
    }
}
exports.ParserConsumerResult = ParserConsumerResult;
