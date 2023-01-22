"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserError = void 0;
class ParserError extends Error {
    offset;
    unexpectedMessage;
    static from(message, cause, unexpectedMessage, offset) {
        const error = new ParserError(message, cause);
        error.unexpectedMessage = unexpectedMessage;
        error.offset = offset;
        return error;
    }
}
exports.ParserError = ParserError;
