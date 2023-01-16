import {
  getTokenName,
  matchIdentifier,
  regexpSticky,
  RuleSeparatorMode,
  separatorToken,
  separatorWhitespace,
  type Rule,
  type RuleTerms,
  type RuleTransformer,
  type Token,
  type TokenIdentifier,
  type TokenList,
} from "@/Helper";

import { ParserConsumer } from "@/ParserConsumer";

interface ParserOptions {
  ruleInitial?: string;
}

export class Parser {
  public readonly rulesMap = new Map<string, Rule[]>();

  public ruleInitial: string | undefined;

  public readonly tokensMap = new Map<TokenIdentifier, TokenList>([
    [separatorToken, [regexpSticky(separatorWhitespace)]],
  ]);

  public constructor(options?: ParserOptions) {
    this.ruleInitial = options?.ruleInitial;
  }

  public separator(token: Token | false) {
    if (token === false) {
      this.tokensMap.delete(separatorToken);

      return;
    }

    this.token(separatorToken, token);
  }

  public token(name: string): void;

  public token(name: TokenIdentifier, token: Token): void;

  public token(name: TokenIdentifier, token?: Token): void {
    const tokenName = getTokenName(name);

    if (this.tokensMap.has(tokenName)) {
      throw new Error(`token "${tokenName}" already defined`);
    }

    if (this.rulesMap.size) {
      throw new Error(`token "${tokenName}" must be declared before rules`);
    }

    const terms = Array.isArray(token)
      ? token
      : token === undefined && typeof name === "string"
      ? [name]
      : [token!];

    this.tokensMap.set(
      name,
      terms.map((term) => (term instanceof RegExp ? regexpSticky(term) : term))
    );
  }

  public tokens(...tokens: string[]): void {
    for (const token of tokens) {
      this.token(token);
    }
  }

  public rule(name: string, terms: RuleTerms, transform?: RuleTransformer) {
    this.rulePush(name, terms, transform, RuleSeparatorMode.OPTIONAL);
  }

  public ruleStrict(
    name: string,
    terms: RuleTerms,
    transform?: RuleTransformer
  ) {
    this.rulePush(name, terms, transform, RuleSeparatorMode.DISALLOWED);
  }

  public ruleSeparated(
    name: string,
    terms: RuleTerms,
    transform?: RuleTransformer
  ) {
    this.rulePush(name, terms, transform, RuleSeparatorMode.MANDATORY);
  }

  public parse(input: string) {
    if (this.rulesMap.size === 0) {
      throw new Error("no rule specified");
    }

    return new ParserConsumer(this, input).consume();
  }

  public rulePush(
    name: string,
    terms: RuleTerms,
    transform: RuleTransformer | undefined,
    separatorMode: RuleSeparatorMode
  ) {
    if (!this.rulesMap.has(name)) {
      this.rulesMap.set(name, []);
      this.ruleInitial ??= name;

      if (this.tokensMap.has(name)) {
        throw new Error(`rule is using name "${name}" reserved for token`);
      }
    }

    const ruleTerms = Array.isArray(terms) ? terms : [terms];

    if (!ruleTerms.length) {
      throw new Error(`rule "${name}" must define at least one term`);
    }

    if (!matchIdentifier(name)) {
      throw new Error(`rule "${name}" does not have a valid identifier`);
    }

    this.rulesMap.get(name)!.push({
      transform,
      separatorMode,
      terms: ruleTerms.map((term) =>
        term instanceof RegExp ? regexpSticky(term) : term
      ),
    });
  }
}
