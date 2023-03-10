import { Prisma, PrismaClient } from "@prisma/client";
import { isServer } from "solid-js/web";
import { HandledError } from "~/lib/error";
import { logger } from "~/lib/logger";

export { Prisma };
export const db = isServer
  ? new PrismaClient()
  : ({
      $connect: () => {
        throw new Error("Cannot connect to database on the client");
      },
    } as unknown as PrismaClient);

export async function useDatabase<T extends any>(fn: (db: PrismaClient) => Promise<T>): Result<T> {
  try {
    return [await fn(db), null];
  } catch (e) {
    return handleError(e);
  }
}

export async function useDatabaseConnection<T extends any>(fn: (db: PrismaClient) => Promise<T>): Result<T> {
  try {
    await db.$connect();
    return [await fn(db), null];
  } catch (e) {
    // logger.error(e);
    await db.$disconnect();
    return handleError(e);
    // process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

export type Result<T> = Promise<[T, null] | [null, HandledError]>;

function returnError(clientMessage: string, error: Error, internalMessage?: string): [null, HandledError] {
  logger.error(internalMessage ?? error.message);
  logger.debug(error.stack);
  return [null, new HandledError(clientMessage, { cause: error, stack: error.stack, status: 500 })];
}

function handleError(e: unknown): [null, HandledError] {
  if (e instanceof HandledError) return [null, e];
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

export function throwOnError([res, err]: Awaited<Result<any>>) {
  if (err) {
    const [_, handled] = handleError(err);
    throw handled;
  }
  return res;
}
