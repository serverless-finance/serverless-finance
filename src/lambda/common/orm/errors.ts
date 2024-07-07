class ORMError extends Error {
  public readonly cause: any;
  public readonly type: string;

  constructor(type: string, message: string, cause?: any) {
    super(`${type}: ${message}`);

    this.type = type;

    if (cause) {
      this.cause = cause;
      if (cause instanceof Error) {
        this.stack += cause.stack ? cause.stack : cause.message;
      }
    }
  }
}

class NotFoundError extends ORMError {
  constructor(type: string, identifier: string, cause?: any) {
    super(type, `item with identifier "${identifier}" does not exist`, cause);
  }
}

export { ORMError, NotFoundError };
