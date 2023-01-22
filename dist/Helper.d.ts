export type TokenTerms = RegExp | TokenTermsArray | string;
export type TokenTermsArray = Array<RegExp | string>;
export type TokenIdentifier = string | symbol;
export type RuleTerms = Array<RegExp | TokenIdentifier | null> | RegExp | TokenIdentifier | null;
export type RuleTransformer = (...args: any[]) => void;
export type RuleValidator = (...args: any[]) => Error | boolean;
export declare const enum RuleSeparatorMode {
    OPTIONAL = 0,
    DISALLOWED = 1,
    MANDATORY = 2
}
export interface RuleLiteral {
    literal: string;
}
export type ArrayUnwrap<T> = T extends Array<infer I> ? I : T;
export declare const regexpSticky: (expression: RegExp) => RegExp;
export declare const isRegexpOptimizable: (expression: RegExp) => boolean;
export declare const match: (regexp: RegExp, input: string, at?: number) => RegExpExecArray | null;
export declare const matchAny: (input: string, at?: number | undefined) => RegExpExecArray | null;
export declare const matchIdentifier: (input: string) => boolean;
export declare const separatorToken: unique symbol;
export declare const separatorWhitespace: RegExp;
export declare const isTokenIdentifier: (x: unknown) => x is TokenIdentifier;
export declare const getTokenIdentifier: (token: TokenIdentifier) => string;
export declare const hasCircularPath: (path: string[]) => boolean;
export declare class MandatorySeparatorError extends Error {
}
