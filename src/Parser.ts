import {
  getTokenName,
  isRegexpTextOnly,
  matchIdentifier,
  regexpSticky,
  RuleSeparatorMode,
  separatorToken,
  separatorWhitespace,
  type RuleTerms,
  type Token,
  type TokenIdentifier,
  type TokenList,
} from "@/Helper";

import { ParserConsumer } from "@/ParserConsumer";
import { ParserRule } from "@/ParserRule";

interface ParserOptions {
  ruleInitial?: string;
}

export class Parser {
  public readonly rulesMap = new Map<string, ParserRule[]>();

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
      terms.map((term) => {
        if (term instanceof RegExp) {
          return isRegexpTextOnly(term.source)
            ? term.source
            : regexpSticky(term);
        }

        return term;
      })
    );
  }

  public tokens(...tokens: string[]): void {
    for (const token of tokens) {
      this.token(token);
    }
  }

  public rule(name: string, terms: RuleTerms) {
    return this.rulePush(name, terms, RuleSeparatorMode.OPTIONAL);
  }

  public ruleStrict(name: string, terms: RuleTerms) {
    return this.rulePush(name, terms, RuleSeparatorMode.DISALLOWED);
  }

  public ruleSeparated(name: string, terms: RuleTerms) {
    return this.rulePush(name, terms, RuleSeparatorMode.MANDATORY);
  }

  public rulePush(
    name: string,
    terms: RuleTerms,
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

    const rule = new ParserRule(
      ruleTerms.map((term) => {
        if (term instanceof RegExp) {
          return isRegexpTextOnly(term.source)
            ? { literal: term.source }
            : regexpSticky(term);
        }

        return term;
      }),
      separatorMode
    );

    this.rulesMap.get(name)!.push(rule);

    return rule;
  }

  public parse(input: string) {
    if (this.rulesMap.size === 0) {
      throw new Error("no rule specified");
    }

    return new ParserConsumer(this, input).consume();
  }
}
