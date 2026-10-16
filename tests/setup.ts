import { afterAll } from "vitest";
import { disconnectDatabase } from "~/backend/db";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://test:test@127.0.0.1:55432/mastometrics_test";
process.env.SESSION_SECRET = "test-session-secret";
process.env.LOG_LEVEL = "error";

afterAll(async () => {
  await disconnectDatabase();
});
