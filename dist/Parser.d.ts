import { RuleSeparatorMode, type RuleTerms, type TokenIdentifier, type TokenTerms, type TokenTermsArray } from "@/Helper";
import { ParserRule } from "@/ParserRule";
interface ParserOptions {
    ruleInitial?: string;
}
export declare class Parser<T = any> {
    readonly rulesMap: Map<string, ParserRule[]>;
    ruleInitial?: string;
    readonly tokensMap: Map<TokenIdentifier, TokenTermsArray>;
    private rulesLastIdentifier?;
    constructor(options?: ParserOptions);
    separator(terms: TokenTerms | false): void;
    token(identifier: string): void;
    token(identifier: TokenIdentifier, terms: TokenTerms): void;
    tokens(...identifiers: string[]): void;
    rule(identifier: string, terms: RuleTerms): ParserRule;
    ruleStrict(identifier: string, terms: RuleTerms): ParserRule;
    ruleSeparated(identifier: string, terms: RuleTerms): ParserRule;
    rulePush(identifier: string, terms: RuleTerms, separatorMode: RuleSeparatorMode): ParserRule;
    parse(input: string): T | undefined;
}
export {};
