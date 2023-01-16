import {
  getKeywordName,
  matchIdentifier,
  regexpSticky,
  RuleSeparatorMode,
  separatorSymbol,
  separatorWhitespace,
  type Keyword,
  type KeywordArray,
  type KeywordIdentifier,
  type Rule,
  type RuleTerm,
  type RuleTransformer,
} from "@/Helper";

import { ParserConsumer } from "@/ParserConsumer";

export class Parser {
  public readonly rules = new Map<string, Rule[]>();

  public readonly keywords = new Map<KeywordIdentifier, KeywordArray>([
    [separatorSymbol, [regexpSticky(separatorWhitespace)]],
  ]);

  public constructor(public ruleInitial?: string) {}

  public separator(keyword: Keyword) {
    this.keyword(separatorSymbol, keyword);
  }

  public keyword(name: string): void;

  public keyword(name: KeywordIdentifier, keyword: Keyword): void;

  public keyword(name: KeywordIdentifier, keyword?: Keyword): void {
    const keywordName = getKeywordName(name);

    if (!matchIdentifier(keywordName)) {
      throw new Error(
        `keyword "${keywordName}" does not have a valid identifier`
      );
    }

    if (this.keywords.has(keywordName)) {
      throw new Error(`keyword "${keywordName}" already defined`);
    }

    if (this.rules.size) {
      throw new Error(`keyword "${keywordName}" must be declared before rules`);
    }

    const keywordTerms = Array.isArray(keyword)
      ? keyword
      : keyword === undefined && typeof name === "string"
      ? [name]
      : [keyword!];

    this.keywords.set(
      name,
      keywordTerms.map((keywordTerm) =>
        keywordTerm instanceof RegExp ? regexpSticky(keywordTerm) : keywordTerm
      )
    );
  }

  public rule(name: string, terms: RuleTerm, transform?: RuleTransformer) {
    this.rulePush(name, terms, transform, RuleSeparatorMode.OPTIONAL);
  }

  public ruleStrict(
    name: string,
    terms: RuleTerm,
    transform?: RuleTransformer
  ) {
    this.rulePush(name, terms, transform, RuleSeparatorMode.DISALLOWED);
  }

  public ruleSeparated(
    name: string,
    terms: RuleTerm,
    transform?: RuleTransformer
  ) {
    this.rulePush(name, terms, transform, RuleSeparatorMode.MANDATORY);
  }

  public parse(input: string) {
    if (this.rules.size === 0) {
      throw new Error("no rule specified");
    }

    return new ParserConsumer(this, input).consume();
  }

  public rulePush(
    name: string,
    terms: RuleTerm,
    transform: RuleTransformer | undefined,
    separatorMode: RuleSeparatorMode
  ) {
    if (!this.rules.has(name)) {
      this.rules.set(name, []);
      this.ruleInitial ??= name;

      if (!matchIdentifier(name)) {
        throw new Error(`rule "${name}" does not have a valid identifier`);
      }

      if (this.keywords.has(name)) {
        throw new Error(`rule is using name "${name}" reserved for keyword`);
      }
    }

    const ruleTerms = Array.isArray(terms) ? terms : [terms];

    this.rules.get(name)!.push({
      transform,
      separatorMode,
      terms: ruleTerms.map((term) =>
        term instanceof RegExp ? regexpSticky(term) : term
      ),
    });
  }
}
