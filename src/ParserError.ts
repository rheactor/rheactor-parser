export class ParserError extends Error {
  public offset!: number;

  public unexpectedMessage?: string;

  public static from(
    message: string,
    cause: ErrorOptions,
    unexpectedMessage: string,
    offset: number
  ) {
    const error = new ParserError(message, cause);

    error.unexpectedMessage = unexpectedMessage;
    error.offset = offset;

    return error;
  }
}
