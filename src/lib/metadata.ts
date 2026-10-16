import type { Prisma } from "~/generated/prisma/client";

type DateTimeString = string;
export type Metadata<T> = T & { [key: string]: Prisma.JsonValue };

export type AccountMetadata = Metadata<{
  pendingImport?: DateTimeString;
  pendingSync?: DateTimeString;
  suspendedSync?: DateTimeString;
  maxImportedNotificationId?: number;
  warnings?: { timestamp: DateTimeString; message: string }[];
}>;

export function setMetadata<T extends Metadata<unknown>>(original: Prisma.JsonValue, assign: Partial<T>): T {
  original = { ...(original as Prisma.JsonObject), ...assign };
  return original as T;
}

export function readMetadata<T extends Metadata<unknown>>(metadata: Prisma.JsonValue): T {
  return (metadata ?? {}) as T;
}
