"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const Helper_1 = require("@/Helper");
const ParserConsumer_1 = require("@/ParserConsumer");
const ParserRule_1 = require("@/ParserRule");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class Parser {
    rulesMap = new Map();
    ruleInitial;
    tokensMap = new Map([
        [Helper_1.separatorToken, [(0, Helper_1.regexpSticky)(Helper_1.separatorWhitespace)]],
    ]);
    rulesLastIdentifier;
    constructor(options) {
        this.ruleInitial = options?.ruleInitial;
    }
    separator(terms) {
        this.tokensMap.delete(Helper_1.separatorToken);
        if (terms !== false) {
            this.token(Helper_1.separatorToken, terms);
        }
    }
    token(identifier, terms) {
        const tokenIdentifier = (0, Helper_1.getTokenIdentifier)(identifier);
        if (this.tokensMap.has(identifier)) {
            throw new Error(`token "${tokenIdentifier}" already defined`);
        }
        if (this.rulesMap.size) {
            throw new Error(`token "${tokenIdentifier}" must be declared before rules`);
        }
        const tokenTerms = Array.isArray(terms)
            ? terms
            : terms === undefined && typeof identifier === "string"
                ? [identifier]
                : [terms];
        this.tokensMap.set(identifier, tokenTerms.map((term) => {
            if (term instanceof RegExp) {
                return (0, Helper_1.isRegexpOptimizable)(term) ? term.source : (0, Helper_1.regexpSticky)(term);
            }
            return term;
        }));
    }
    tokens(...identifiers) {
        for (const identifier of identifiers) {
            this.token(identifier);
        }
    }
    rule(identifier, terms) {
        return this.rulePush(identifier, terms, Helper_1.RuleSeparatorMode.OPTIONAL);
    }
    ruleStrict(identifier, terms) {
        return this.rulePush(identifier, terms, Helper_1.RuleSeparatorMode.DISALLOWED);
    }
    ruleSeparated(identifier, terms) {
        return this.rulePush(identifier, terms, Helper_1.RuleSeparatorMode.MANDATORY);
    }
    rulePush(identifier, terms, separatorMode) {
        if (!this.rulesMap.has(identifier)) {
            this.rulesMap.set(identifier, []);
            this.ruleInitial ??= identifier;
            if (this.tokensMap.has(identifier)) {
                throw new Error(`rule is using identifier "${identifier}" reserved for token`);
            }
        }
        else if (this.rulesLastIdentifier !== undefined &&
            this.rulesLastIdentifier !== identifier) {
            throw new Error(`rule "${identifier}" must be declared sequentially`);
        }
        const ruleTerms = Array.isArray(terms) ? terms : [terms];
        if (!ruleTerms.length) {
            throw new Error(`rule "${identifier}" must define at least one term`);
        }
        if (!(0, Helper_1.matchIdentifier)(identifier)) {
            throw new Error(`rule "${identifier}" does not have a valid identifier`);
        }
        const rule = new ParserRule_1.ParserRule(ruleTerms.map((term) => {
            if (term instanceof RegExp) {
                return (0, Helper_1.isRegexpOptimizable)(term)
                    ? { literal: term.source }
                    : (0, Helper_1.regexpSticky)(term);
            }
            return term;
        }), separatorMode);
        this.rulesLastIdentifier = identifier;
        this.rulesMap.get(identifier).push(rule);
        return rule;
    }
    parse(input) {
        if (this.rulesMap.size === 0) {
            throw new Error("no rule specified");
        }
        return new ParserConsumer_1.ParserConsumer(this, input).consume();
    }
}
exports.Parser = Parser;
