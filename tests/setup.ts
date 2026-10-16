import { afterAll } from "vitest";
import { disconnectDatabase } from "~/backend/db";
import { dns } from "~/lib/mastodon/safe-fetch";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://test:test@127.0.0.1:55432/mastometrics_test";
process.env.SESSION_SECRET = "test-session-secret";
process.env.LOG_LEVEL = "error";

// Tests mock fetch, every instance resolves to a public documentation address (TEST-NET-3)
dns.lookup = async () => [{ address: "203.0.113.10", family: 4 }];

afterAll(async () => {
  await disconnectDatabase();
});
