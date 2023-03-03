import { ServerError } from "solid-start";

export class HandledError extends ServerError {
  constructor(message: string, options?: ErrorOptions & { status?: number; stack?: string }) {
    super(message, options);
    this.name = "ClientError";
  }
}
