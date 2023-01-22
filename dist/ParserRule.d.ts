import type { ArrayUnwrap, RuleLiteral, RuleSeparatorMode, RuleTerms, RuleTransformer, RuleValidator } from "./Helper";
export declare class ParserRule {
    terms: Array<ArrayUnwrap<RuleTerms> | RuleLiteral>;
    separatorMode?: RuleSeparatorMode | undefined;
    transformer?: RuleTransformer;
    validator?: RuleValidator;
    constructor(terms: Array<ArrayUnwrap<RuleTerms> | RuleLiteral>, separatorMode?: RuleSeparatorMode | undefined);
    transform(transformer: RuleTransformer): this;
    validate(validator: RuleValidator): this;
    wrap(): this;
}
