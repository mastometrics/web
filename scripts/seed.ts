// Seed a local development database with demo data: `npm run db:seed`
// Prints a session cookie so you can browse the dashboard without signing in through Mastodon.
import { disconnectDatabase } from "~/backend/db";
import { createSessionValue, SESSION_COOKIE } from "~/backend/session";
import { resetDatabase, seedDatabase } from "../tests/seed";

await resetDatabase();
const { admin, user, demo } = await seedDatabase();
console.log(`Seeded demo data. Admin account: ${demo.username}`);
if (process.env.SESSION_SECRET) {
  console.log(`Admin session cookie:   ${SESSION_COOKIE}=${createSessionValue(admin.id)}`);
  console.log(`Regular session cookie: ${SESSION_COOKIE}=${createSessionValue(user.id)}`);
}
await disconnectDatabase();
