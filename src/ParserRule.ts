import type {
  ArrayUnwrap,
  RuleLiteral,
  RuleSeparatorMode,
  RuleTerms,
  RuleTransformer,
  RuleValidator,
} from "@/Helper";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.transform((...args: any[]) => args);
  }
}
