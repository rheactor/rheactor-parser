import type {
  Any,
  ArrayUnwrap,
  RuleLiteral,
  RuleSeparatorMode,
  RuleTerms,
  RuleTransformer,
  RuleValidator,
} from "./Helper";

export class ParserRule {
  public transformer?: RuleTransformer;

  public validator?: RuleValidator;

  public constructor(
    public terms: Array<ArrayUnwrap<RuleTerms> | RuleLiteral>,
    public separatorMode?: RuleSeparatorMode
  ) {}

  public transform(transformer: RuleTransformer) {
    this.transformer = transformer;

    return this;
  }

  public validate(validator: RuleValidator) {
    this.validator = validator;

    return this;
  }

  public wrap() {
    return this.transform((...args: Any[]) => args);
  }
}
