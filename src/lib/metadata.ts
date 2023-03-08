import { Prisma } from "@prisma/client";

type DateTimeString = string;
export type Metadata<T> = T & { [key: string]: Prisma.JsonValue };

export type AccountMetadata = Metadata<{
  pendingImport?: DateTimeString;
  suspendedSync?: DateTimeString;
  warnings?: { timestamp: DateTimeString; message: string }[];
}>;

export function setMetadata<T extends Metadata<unknown>>(metadata: Prisma.JsonValue, assign: Partial<T>): T {
  metadata = { ...(metadata as Prisma.JsonObject), ...assign };
  return metadata as T;
}

export function readMetadata<T extends Metadata<unknown>>(metadata: Prisma.JsonValue): T {
  return metadata as T;
}
