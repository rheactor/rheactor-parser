import {
  getTokenIdentifier,
  hasCircularPath,
  isTokenIdentifier,
  MandatorySeparatorError,
  match,
  matchAny,
  RuleSeparatorMode,
  separatorToken,
  type Any,
  type TokenIdentifier,
} from "@/Helper";

import { type Parser } from "@/Parser";
import { ParserConsumerResult } from "@/ParserConsumerResult";
import { ParserError } from "@/ParserError";
import { type ParserRule } from "@/ParserRule";

export class ParserConsumer {
  private offsetLead: number | undefined;

  private readonly transformations = new Map<ParserConsumerResult, Any>();

  public constructor(public parser: Parser, public input: string) {}

  public consume() {
    const consume = this.consumeRule(this.parser.ruleInitial!);

    if (this.input) {
      if (
        this.offsetLead === undefined ||
        this.offsetLead !== this.input.length
      ) {
        const inputPosition = matchAny(this.input, this.offsetLead)?.[0];
        const errorOffset = Math.max(0, this.offsetLead ?? 0);

        throw new Error(
          `unexpected "${inputPosition}" at offset ${errorOffset}`
        );
      } else if (consume === undefined) {
        throw new Error(
          `unexpected "${matchAny(this.input)?.[0]}" at offset 0`
        );
      }
    } else if (this.offsetLead === undefined) {
      throw new Error(`unexpected empty input`);
    }

    // Performs the entire process of transforming the terms found.
    return this.applyTransformation(consume!);
  }

  private applyTransformation(consume: ParserConsumerResult): Any {
    const transformation = this.transformations.get(consume);

    if (transformation !== undefined) {
      return transformation;
    }

    if (typeof consume.matches === "string") {
      return consume.rule.transformer?.(consume.matches) ?? consume.matches;
    }

    if (Array.isArray(consume.matches)) {
      const matchesTransformed = consume.matches.map((matched) =>
        matched instanceof ParserConsumerResult
          ? this.applyTransformation(matched)
          : matched
      );

      return (
        consume.rule.transformer?.(...matchesTransformed) ?? matchesTransformed
      );
    }

    if (consume.matches instanceof ParserConsumerResult) {
      const matchTransformation = this.applyTransformation(consume.matches);

      return (
        consume.rule.transformer?.(
          ...(Array.isArray(matchTransformation)
            ? matchTransformation
            : [matchTransformation])
        ) ?? matchTransformation
      );
    }

    return consume.matches;
  }

  private consumeToken(identifier: TokenIdentifier, offset: number): number {
    const token = this.parser.tokensMap.get(identifier);

    if (token) {
      for (const term of token) {
        if (term instanceof RegExp) {
          const termResult = match(term, this.input, offset);

          if (termResult) {
            return termResult[0].length;
          }
        } else if (this.input.startsWith(term, offset)) {
          return term.length;
        }
      }
    }

    return 0;
  }

  private consumeSeparator(rule: ParserRule, offset: number) {
    if (rule.separatorMode !== RuleSeparatorMode.DISALLOWED) {
      const consumeToken = this.consumeToken(separatorToken, offset);

      if (consumeToken) {
        this.offsetLead = Math.max(offset + consumeToken, this.offsetLead ?? 0);
      } else if (rule.separatorMode === RuleSeparatorMode.MANDATORY) {
        throw new MandatorySeparatorError();
      }

      return offset + consumeToken;
    }

    return offset;
  }

  private consumeRule(
    identifier: string,
    offsetIn = 0,
    path: string[] = [identifier]
  ): ParserConsumerResult | undefined {
    if (hasCircularPath(path)) {
      return undefined;
    }

    const rules = this.parser.rulesMap.get(identifier)!;

    rule: for (const rule of rules) {
      const termsLength = rule.terms.length;

      let matches: ParserConsumerResult["matches"];
      let offset = offsetIn;

      for (let termIndex = 0; termIndex < termsLength; termIndex++) {
        const term = rule.terms[termIndex];

        try {
          offset = this.consumeSeparator(rule, offset);
        } catch (error) {
          if (error instanceof MandatorySeparatorError && termIndex !== 0) {
            continue rule;
          }
        }

        if (term instanceof RegExp) {
          const termResult = match(term, this.input, offset);

          if (termResult) {
            if (Array.isArray(matches)) {
              if (termResult.length > 1) {
                const [, ...termCaptured] = termResult;

                matches.push(...termCaptured);
              } else {
                matches.push(termResult[0]);
              }
            } else if (termResult.length > 1) {
              const [, ...termCaptured] = termResult;

              if (matches === undefined) {
                if (termCaptured.length === 1) {
                  [matches] = termCaptured;
                } else {
                  matches = [...termCaptured];
                }
              } else {
                matches = [matches, ...termCaptured];
              }
            } else if (matches === undefined) {
              [matches] = termResult;
            } else {
              matches = [matches, termResult[0]];
            }

            offset += termResult[0].length;
            this.offsetLead = Math.max(offset, this.offsetLead ?? 0);
            continue;
          }

          continue rule;
        } else if (isTokenIdentifier(term)) {
          if (this.parser.tokensMap.has(term)) {
            const consumeToken = this.consumeToken(term, offset);

            if (!consumeToken) {
              continue rule;
            }

            offset += consumeToken;
            this.offsetLead = Math.max(offset, this.offsetLead ?? 0);
            continue;
          }

          if (typeof term === "string" && this.parser.rulesMap.has(term)) {
            if (termIndex === 0 && term === identifier) {
              continue rule;
            }

            const consumeRule =
              offsetIn === offset
                ? this.consumeRule(term, offset, [...path, term])
                : this.consumeRule(term, offset);

            if (consumeRule !== undefined) {
              if (Array.isArray(matches)) {
                matches.push(consumeRule);
              } else if (matches === undefined) {
                matches = consumeRule;
              } else {
                matches = [matches, consumeRule];
              }

              ({ offset } = consumeRule);
              continue;
            }

            continue rule;
          }
        } else if (term && "literal" in term) {
          if (this.input.startsWith(term.literal, offset)) {
            if (Array.isArray(matches)) {
              matches.push(term.literal);
            } else if (matches === undefined) {
              matches = term.literal;
            } else {
              matches = [matches, term.literal];
            }

            offset += term.literal.length;
            this.offsetLead = Math.max(offset, this.offsetLead ?? 0);
            continue;
          }

          continue rule;
        } else {
          matches ??= null;
          continue;
        }

        const tokenIdentifier = getTokenIdentifier(term!);
        const ruleIdentifier =
          rules.length > 1
            ? `${identifier}[${rules.indexOf(rule)}]`
            : identifier;

        throw new Error(
          `unknown term "${tokenIdentifier}" at rule "${ruleIdentifier}"`
        );
      }

      if (rule.separatorMode !== RuleSeparatorMode.MANDATORY) {
        offset = this.consumeSeparator(rule, offset);
      }

      this.offsetLead ??= 0;

      const consumerResult = new ParserConsumerResult(rule, offset, matches);

      if (rule.validator) {
        const consumerTransformation = this.applyTransformation(consumerResult);
        const ruleValidation = rule.validator(consumerTransformation);

        this.transformations.set(consumerResult, consumerTransformation);

        if (ruleValidation === false) {
          return undefined;
        } else if (ruleValidation instanceof Error) {
          const inputPosition = matchAny(this.input, offsetIn)?.[0];

          throw ParserError.from(
            ruleValidation.message,
            { cause: ruleValidation.cause },
            `unexpected "${inputPosition}"`,
            offsetIn
          );
        }
      }

      return consumerResult;
    }

    return undefined;
  }
}
