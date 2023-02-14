import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();
export async function runInConnection<T extends any>(fn: (db: PrismaClient) => Promise<T>): Result<T> {
  try {
    await db.$connect();
    return [await fn(db), null];
  } catch (e) {
    // console.error(e);
    await db.$disconnect();
    return [null, e as Error];
    // process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

export type Result<T> = Promise<[T, null] | [null, Error]>;
