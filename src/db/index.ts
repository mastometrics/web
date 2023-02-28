import { Prisma, PrismaClient } from "@prisma/client";
import { ClientError } from "~/lib/error";

export { Prisma };
export const db = new PrismaClient();

// todo: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#instantiate-prismaclient-outside-the-handler
export async function runInConnection<T extends any>(fn: (db: PrismaClient) => Promise<T>): Result<T> {
  try {
    await db.$connect();
    return [await fn(db), null];
  } catch (e) {
    // console.error(e);
    await db.$disconnect();
    return handleError(e);
    // process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

export type Result<T> = Promise<[T, null] | [null, ClientError]>;

function returnError(clientMessage: string, error: Error, internalMessage?: string): [null, ClientError] {
  console.error(internalMessage ?? error.message, error);
  return [null, new ClientError(clientMessage, { cause: error })];
}

function handleError(e: unknown): [null, ClientError] {
  if (e instanceof ClientError) return [null, e];
  else if (e instanceof Prisma.PrismaClientKnownRequestError)
    return returnError(
      `A known database error occurred (${e.code})`,
      e,
      `${e.message} https://www.prisma.io/docs/reference/api-reference/error-reference#${e.code.toLowerCase()}`
    );
  else if (e instanceof Prisma.PrismaClientValidationError)
    return returnError(`A database validation error occurred`, e);
  else if (e instanceof Prisma.PrismaClientInitializationError)
    return returnError(`A database initialization error occurred`, e);
  else if (e instanceof Prisma.PrismaClientRustPanicError) return returnError(`A database panic error occurred`, e);
  else if (e instanceof Prisma.PrismaClientUnknownRequestError)
    return returnError(`An unknown database error occurred`, e);
  else return returnError("A unhandled database error occured", e as Error);
}
