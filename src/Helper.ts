export type TokenTerms = RegExp | TokenTermsArray | string;

export type TokenTermsArray = Array<RegExp | string>;

export type TokenIdentifier = string | symbol;

export type RuleTerms =
  | Array<RegExp | TokenIdentifier | null>
  | RegExp
  | TokenIdentifier
  | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RuleTransformer = (...args: any[]) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RuleValidator = (...args: any[]) => Error | boolean;

export const enum RuleSeparatorMode {
  OPTIONAL,
  DISALLOWED,
  MANDATORY,
}

export interface RuleLiteral {
  literal: string;
}

export type ArrayUnwrap<T> = T extends Array<infer I> ? I : T;

export const regexpSticky = (expression: RegExp) =>
  new RegExp(
    expression,
    `y${expression.ignoreCase ? "i" : ""}${expression.unicode ? "u" : ""}`
  );

const TEXT_ONLY_REGEXP = /^[\w\s-]+$/u;

const isRegexpTextOnly = (string: string) =>
  TEXT_ONLY_REGEXP.exec(string) !== null;

export const isRegexpOptimizable = (expression: RegExp) =>
  !expression.ignoreCase && isRegexpTextOnly(expression.source);

export const match = (regexp: RegExp, input: string, at = 0) => {
  regexp.lastIndex = at;

  return regexp.exec(input);
};

export const matchAny = match.bind(null, /\d+|\w+|./uy);

export const matchIdentifier = (input: string) =>
  /^[a-z_][a-z0-9]*$/iu.test(input);

export const separatorToken = Symbol("separator");

export const separatorWhitespace = /\s+/u;

export const isTokenIdentifier = (x: unknown): x is TokenIdentifier =>
  typeof x === "string" || typeof x === "symbol";

export const getTokenIdentifier = (token: TokenIdentifier): string =>
  typeof token === "symbol" ? token.description ?? token.toString() : token;

export const hasCircularPath = (path: string[]): boolean => {
  if (path.length < 2) {
    return false;
  }

  const pathLastIndex = path.length - 1;
  const pathLast = path[pathLastIndex]!;
  const pathCircularIndex = path.lastIndexOf(pathLast, pathLastIndex - 1);

  if (pathCircularIndex === -1) {
    return false;
  }

  const sequenceLeft = path.slice(
    pathCircularIndex - (pathLastIndex - pathCircularIndex - 1),
    pathCircularIndex
  );
  const sequenceRight = path.slice(pathCircularIndex + 1, -1);

  return sequenceLeft.join() === sequenceRight.join();
};

export class MandatorySeparatorError extends Error {}
