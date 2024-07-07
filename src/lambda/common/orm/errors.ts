class ORMError extends Error {
  cause: any;

  constructor(type: string, message: string, cause?: any) {
    super(`${type}: ${message}`);

    if (cause) {
      this.cause = cause;
    }
  }
}

class NotFoundError extends ORMError {
  constructor(type: string, identifier: string, cause?: any) {
    super(type, `item with identifier "${identifier}" does not exist`, cause);
  }
}

export { ORMError, NotFoundError };
