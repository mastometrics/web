import { useDatabase } from "~/backend/db";
import { logger } from "~/lib/logger";

export async function requeueStuckSyncs() {
  return useDatabase(async (db) => {
    const stuckAccountsCount = await db.$executeRaw`
      UPDATE "accounts"
        SET metadata = jsonb_set(metadata, '{pendingSync}', 'null', false)
      WHERE tracking = true
        AND metadata->>'suspendedSync' IS NULL
        AND jsonb_extract_path_text( metadata, 'pendingSync')::timestamp < NOW() - interval '30 minutes';
    `;
    if (stuckAccountsCount) logger.warn(`🤨 Requeued ${stuckAccountsCount} stuck accounts`);
  });
}
