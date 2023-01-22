export declare class ParserError extends Error {
    offset: number;
    unexpectedMessage?: string;
    static from(message: string, cause: ErrorOptions, unexpectedMessage: string, offset: number): ParserError;
}
