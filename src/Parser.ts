import {
  getTokenIdentifier,
  isRegexpOptimizable,
  matchIdentifier,
  regexpSticky,
  RuleSeparatorMode,
  separatorToken,
  separatorWhitespace,
  type RuleTerms,
  type TokenIdentifier,
  type TokenTerms,
  type TokenTermsArray,
} from "@/Helper";

import { ParserConsumer } from "@/ParserConsumer";
import { ParserRule } from "@/ParserRule";

interface ParserOptions {
  ruleInitial?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Parser<T = any> {
  public readonly rulesMap = new Map<string, ParserRule[]>();

  public ruleInitial?: string;

  public readonly tokensMap = new Map<TokenIdentifier, TokenTermsArray>([
    [separatorToken, [regexpSticky(separatorWhitespace)]],
  ]);

  private rulesLastIdentifier?: string;

  public constructor(options?: ParserOptions) {
    this.ruleInitial = options?.ruleInitial;
  }

  public separator(terms: TokenTerms | false) {
    this.tokensMap.delete(separatorToken);

    if (terms !== false) {
      this.token(separatorToken, terms);
    }
  }

  public token(identifier: string): void;

  public token(identifier: TokenIdentifier, terms: TokenTerms): void;

  public token(identifier: TokenIdentifier, terms?: TokenTerms): void {
    const tokenIdentifier = getTokenIdentifier(identifier);

    if (this.tokensMap.has(identifier)) {
      throw new Error(`token "${tokenIdentifier}" already defined`);
    }

    if (this.rulesMap.size) {
      throw new Error(
        `token "${tokenIdentifier}" must be declared before rules`
      );
    }

    const tokenTerms = Array.isArray(terms)
      ? terms
      : terms === undefined && typeof identifier === "string"
      ? [identifier]
      : [terms!];

    this.tokensMap.set(
      identifier,
      tokenTerms.map((term) => {
        if (term instanceof RegExp) {
          return isRegexpOptimizable(term) ? term.source : regexpSticky(term);
        }

        return term;
      })
    );
  }

  public tokens(...identifiers: string[]): void {
    for (const identifier of identifiers) {
      this.token(identifier);
    }
  }

  public rule(identifier: string, terms: RuleTerms) {
    return this.rulePush(identifier, terms, RuleSeparatorMode.OPTIONAL);
  }

  public ruleStrict(identifier: string, terms: RuleTerms) {
    return this.rulePush(identifier, terms, RuleSeparatorMode.DISALLOWED);
  }

  public ruleSeparated(identifier: string, terms: RuleTerms) {
    return this.rulePush(identifier, terms, RuleSeparatorMode.MANDATORY);
  }

  public rulePush(
    identifier: string,
    terms: RuleTerms,
    separatorMode: RuleSeparatorMode
  ) {
    if (!this.rulesMap.has(identifier)) {
      this.rulesMap.set(identifier, []);
      this.ruleInitial ??= identifier;

      if (this.tokensMap.has(identifier)) {
        throw new Error(
          `rule is using identifier "${identifier}" reserved for token`
        );
      }
    } else if (
      this.rulesLastIdentifier !== undefined &&
      this.rulesLastIdentifier !== identifier
    ) {
      throw new Error(`rule "${identifier}" must be declared sequentially`);
    }

    const ruleTerms = Array.isArray(terms) ? terms : [terms];

    if (!ruleTerms.length) {
      throw new Error(`rule "${identifier}" must define at least one term`);
    }

    if (!matchIdentifier(identifier)) {
      throw new Error(`rule "${identifier}" does not have a valid identifier`);
    }

    const rule = new ParserRule(
      ruleTerms.map((term) => {
        if (term instanceof RegExp) {
          return isRegexpOptimizable(term)
            ? { literal: term.source }
            : regexpSticky(term);
        }

        return term;
      }),
      separatorMode
    );

    this.rulesLastIdentifier = identifier;
    this.rulesMap.get(identifier)!.push(rule);

    return rule;
  }

  public parse(input: string): T | undefined {
    if (this.rulesMap.size === 0) {
      throw new Error("no rule specified");
    }

    return new ParserConsumer(this, input).consume();
  }
}
