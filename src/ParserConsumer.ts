import {
  getTokenName,
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
import { type Rule } from "./Helper";

import { type Parser } from "@/Parser";
import { ParserConsumerResult } from "@/ParserConsumerResult";

export class ParserConsumer {
  private offsetLead: number | undefined;

  public constructor(public parser: Parser, public input: string) {}

  private static applyTransformation(consume: ParserConsumerResult): Any {
    if (typeof consume.matches === "string") {
      return consume.rule.transform?.(consume.matches) ?? consume.matches;
    }

    if (Array.isArray(consume.matches)) {
      const matchesTransformed = consume.matches.map((matched) =>
        matched instanceof ParserConsumerResult
          ? this.applyTransformation(matched)
          : matched
      );

      return (
        consume.rule.transform?.(...matchesTransformed) ?? matchesTransformed
      );
    }

    if (consume.matches instanceof ParserConsumerResult) {
      return this.applyTransformation(consume.matches);
    }

    return undefined;
  }

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
    return ParserConsumer.applyTransformation(consume!);
  }

  private consumeToken(name: TokenIdentifier, offset: number): number {
    const token = this.parser.tokensMap.get(name);

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

  private consumeSeparator(rule: Rule, offset: number) {
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
    name: string,
    offsetIn = 0,
    path: string[] = [name]
  ): ParserConsumerResult | undefined {
    if (hasCircularPath(path)) {
      return undefined;
    }

    const rules = this.parser.rulesMap.get(name)!;

    rule: for (const rule of rules) {
      const termsLength = rule.terms.length;

      let matches: ParserConsumerResult["matches"] | null;
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

              if (matches) {
                matches = [matches, ...termCaptured];
              } else if (termCaptured.length === 1) {
                [matches] = termCaptured;
              } else {
                matches = [...termCaptured];
              }
            } else if (matches) {
              matches = [matches, termResult[0]];
            } else {
              [matches] = termResult;
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
            if (termIndex === 0 && term === name) {
              continue rule;
            }

            const consumeRule =
              offsetIn === offset
                ? this.consumeRule(term, offset, [...path, term])
                : this.consumeRule(term, offset);

            if (consumeRule !== undefined) {
              if (Array.isArray(matches)) {
                matches.push(consumeRule);
              } else if (matches) {
                matches = [matches, consumeRule];
              } else {
                matches = consumeRule;
              }

              ({ offset } = consumeRule);
              continue;
            }

            continue rule;
          }
        } else {
          matches ??= null;
          continue;
        }

        const termName = getTokenName(term!);
        const ruleName =
          rules.length > 1 ? `${name}[${rules.indexOf(rule)}]` : name;

        throw new Error(`unknown term "${termName}" at rule "${ruleName}"`);
      }

      if (rule.separatorMode !== RuleSeparatorMode.MANDATORY) {
        offset = this.consumeSeparator(rule, offset);
      }

      this.offsetLead ??= 0;

      return new ParserConsumerResult(rule, offset, matches ?? undefined);
    }

    return undefined;
  }
}
