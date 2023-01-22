"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserRule = void 0;
class ParserRule {
    terms;
    separatorMode;
    transformer;
    validator;
    constructor(terms, separatorMode) {
        this.terms = terms;
        this.separatorMode = separatorMode;
    }
    transform(transformer) {
        this.transformer = transformer;
        return this;
    }
    validate(validator) {
        this.validator = validator;
        return this;
    }
    wrap() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.transform((...args) => args);
    }
}
exports.ParserRule = ParserRule;
