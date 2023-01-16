import type {
  ArrayUnwrap,
  RuleLiteral,
  RuleSeparatorMode,
  RuleTerms,
  RuleTransformer,
} from "./Helper";

export class ParserRule {
  public transformer: RuleTransformer | undefined;

  public constructor(
    public terms: Array<ArrayUnwrap<RuleTerms> | RuleLiteral>,
    public separatorMode?: RuleSeparatorMode
  ) {}

  public transform(transformer: RuleTransformer) {
    this.transformer = transformer;

    return this;
  }
}
