// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = any;

export type Keyword = KeywordArray | RegExp | string;

export type KeywordArray = Array<RegExp | string>;

export type KeywordIdentifier = string | symbol;

export type RuleTerm =
  | Array<KeywordIdentifier | RegExp | null>
  | KeywordIdentifier
  | RegExp
  | null;

export type RuleTransformer = (...args: Any[]) => void;

export const enum RuleSeparatorMode {
  OPTIONAL,
  DISALLOWED,
  MANDATORY,
}

export interface Rule {
  terms: Array<ArrayUnwrap<RuleTerm>>;
  separatorMode?: RuleSeparatorMode;
  transform?: RuleTransformer;
}

export type ArrayUnwrap<T> = T extends Array<infer I> ? I : T;

export const regexpSticky = (expression: RegExp) =>
  new RegExp(expression, "yu");

export const match = (regexp: RegExp, input: string, at = 0) => {
  regexp.lastIndex = at;

  return regexp.exec(input);
};

export const matchAny = match.bind(null, /\d+|\w+|./uy);

export const separatorSymbol = Symbol("separator");

export const separatorWhitespace = /\s+/u;

export const isKeywordIdentifier = (x: unknown): x is KeywordIdentifier =>
  typeof x === "string" || typeof x === "symbol";

export const getKeywordName = (keyword: KeywordIdentifier): string =>
  typeof keyword === "symbol"
    ? keyword.description ?? keyword.toString()
    : keyword;

export class MandatorySeparatorError extends Error {}
