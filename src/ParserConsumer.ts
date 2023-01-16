import {
  getKeywordName,
  isKeywordIdentifier,
  MandatorySeparatorError,
  match,
  matchAny,
  RuleSeparatorMode,
  separatorSymbol,
  type Any,
  type KeywordIdentifier,
} from "@/Helper";
import { type Rule } from "./Helper";

import { type Parser } from "@/Parser";
import { ParserConsumerResult } from "@/ParserConsumerResult";

export class ParserConsumer {
  public offsetLead: number | undefined;

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

      return consume.rule.transform?.(matchesTransformed) ?? matchesTransformed;
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
      }
    } else if (this.offsetLead === undefined) {
      throw new Error(`unexpected empty input`);
    }

    // Performs the entire process of transforming the terms found.
    return ParserConsumer.applyTransformation(consume!);
  }

  private consumeKeyword(name: KeywordIdentifier, offset: number): number {
    const keyword = this.parser.keywords.get(name);

    if (keyword) {
      for (const keywordTerm of keyword) {
        if (keywordTerm instanceof RegExp) {
          const termResult = match(keywordTerm, this.input, offset);

          if (termResult) {
            return termResult[0].length;
          }
        } else if (this.input.startsWith(keywordTerm, offset)) {
          return keywordTerm.length;
        }
      }
    }

    return 0;
  }

  private consumeSeparator(rule: Rule, offset: number) {
    if (rule.separatorMode !== RuleSeparatorMode.DISALLOWED) {
      const consumeKeyword = this.consumeKeyword(separatorSymbol, offset);

      if (consumeKeyword) {
        this.offsetLead = Math.max(
          offset + consumeKeyword,
          this.offsetLead ?? 0
        );
      } else if (rule.separatorMode === RuleSeparatorMode.MANDATORY) {
        throw new MandatorySeparatorError();
      }

      return offset + consumeKeyword;
    }

    return offset;
  }

  private consumeRule(
    name: string,
    offsetIn = 0
  ): ParserConsumerResult | undefined {
    const rules = this.parser.rules.get(name)!;

    rule: for (const rule of rules) {
      let matches: ParserConsumerResult["matches"] | null;
      let offset = offsetIn;

      for (let termIndex = 0; termIndex < rule.terms.length; termIndex++) {
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
              matches.push(...termResult);
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
        } else if (isKeywordIdentifier(term)) {
          if (this.parser.keywords.has(term)) {
            const consumeKeyword = this.consumeKeyword(term, offset);

            if (!consumeKeyword) {
              continue rule;
            }

            offset += consumeKeyword;
            this.offsetLead = Math.max(offset, this.offsetLead ?? 0);
            continue;
          }

          if (typeof term === "string" && this.parser.rules.has(term)) {
            const consumeRule = this.consumeRule(term, offset);

            if (consumeRule === undefined) {
              this.offsetLead = Math.max(offset, this.offsetLead ?? 0);
            } else {
              if (Array.isArray(matches)) {
                matches.push(consumeRule);
              } else if (matches) {
                matches = [matches, consumeRule];
              } else {
                matches = consumeRule;
              }

              ({ offset } = consumeRule);
              this.offsetLead = Math.max(offset, this.offsetLead ?? 0);
              continue;
            }

            continue rule;
          }
        } else if (term === null) {
          matches ??= null;
          continue;
        }

        const termName = getKeywordName(term!);
        const ruleName =
          rules.length > 1 ? `${name}[${rules.indexOf(rule)}]` : name;

        throw new Error(`unknown term "${termName}" at rule "${ruleName}"`);
      }

      if (offset !== offsetIn || matches !== undefined) {
        if (rule.separatorMode !== RuleSeparatorMode.MANDATORY) {
          offset = this.consumeSeparator(rule, offset);
        }

        this.offsetLead ??= 0;

        return new ParserConsumerResult(rule, offset, matches ?? undefined);
      }
    }

    return undefined;
  }
}
