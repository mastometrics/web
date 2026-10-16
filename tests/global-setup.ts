// Migrates the test database once before all tests.
// Uses TEST_DATABASE_URL (never DATABASE_URL, which may point to a real database in .env).
import { execFileSync } from "node:child_process";
import { assertLocalDatabase } from "./seed";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://test:test@127.0.0.1:55432/mastometrics_test";
  assertLocalDatabase(url);
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
