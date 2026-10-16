/** An error with a message that is safe to show to the user */
export class HandledError extends Error {
  status: number;
  constructor(message: string, options?: ErrorOptions & { status?: number; stack?: string }) {
    super(message, options);
    this.name = "ClientError";
    this.status = options?.status ?? 400;
    if (options?.stack) this.stack = options.stack;
  }
}
