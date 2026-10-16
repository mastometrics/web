import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "~/generated/prisma/client";
import { HandledError } from "~/lib/error";
import { logger } from "~/lib/logger";

export { Prisma };

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };

function getClient() {
  if (!globalForPrisma.__prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL environment variable is required");
    const adapter = new PrismaPg({ connectionString, ...poolOptions(connectionString) });
    globalForPrisma.__prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.__prisma;
}

/**
 * Connection pool size and the time to wait for a free connection, configurable with the `connection_limit` and
 * `pool_timeout` (seconds, 0 to wait indefinitely) parameters of the connection string, like Prisma's query engine did.
 * The worker syncs many accounts concurrently, so queries regularly have to wait for a connection.
 */
export function poolOptions(connectionString: string) {
  const params = new URL(connectionString).searchParams;
  const limit = Number(params.get("connection_limit"));
  const timeout = Number(params.get("pool_timeout") ?? 30);
  return {
    max: Number.isInteger(limit) && limit > 0 ? limit : 10,
    connectionTimeoutMillis: Number.isFinite(timeout) && timeout >= 0 ? timeout * 1000 : 30_000,
  };
}

/** Lazily connected Prisma client, so importing this module never requires a database */
export const db = new Proxy({} as PrismaClient, {
  get(_, key) {
    const client = getClient();
    const value = Reflect.get(client, key);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export async function disconnectDatabase() {
  await globalForPrisma.__prisma?.$disconnect();
  globalForPrisma.__prisma = undefined;
}

export async function useDatabase<T extends any>(fn: (db: PrismaClient) => Promise<T>): Result<T> {
  try {
    return [await fn(db), null];
  } catch (e) {
    return handleError(e);
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

/**
 * Whether an error (or its cause) came from the database rather than from Mastodon or the account itself, like a
 * connection or transaction timeout when the database is slow or busy
 */
export function isDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    /timeout exceeded when trying to connect|Connection terminated/i.test(error.message)
  )
    return true;
  return isDatabaseError(error.cause);
}

export function throwOnError<T>([res, err]: Awaited<Result<T>>): T {
  if (err) {
    const [_, handled] = handleError(err);
    throw handled;
  }
  return res;
}
