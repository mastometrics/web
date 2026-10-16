// Delete the data of accounts that revoked access to MastoMetrics, see "Deleting revoked accounts" in the README.
// Development: `npm run accounts:purge-revoked -- --help`
// Production build: `node dist/scripts/purge-revoked-accounts.mjs --help`
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { disconnectDatabase } from "~/backend/db";
import { PURGE_REVOKED_AFTER_DAYS, purgeRevokedAccounts } from "~/workers/purge-revoked-accounts";

if (existsSync(".env")) process.loadEnvFile(".env");

const { values: args } = parseArgs({
  options: {
    days: { type: "string", default: `${PURGE_REVOKED_AFTER_DAYS}` },
    "no-verify": { type: "boolean", default: false },
    limit: { type: "string" },
    apply: { type: "boolean", default: false },
    help: { type: "boolean", short: "h" },
  },
});

if (args.help) {
  console.log(`Delete all data of accounts whose instance rejected MastoMetrics' token (access revoked) more than
${PURGE_REVOKED_AFTER_DAYS} days ago and that didn't sign in since. Accounts suspended because of errors are never deleted.
Only reports what it would do, unless --apply is given.

  --days <n>     revoked more than N days ago (default ${PURGE_REVOKED_AFTER_DAYS})
  --no-verify    don't ask the instances whether the tokens are still rejected first
  --limit <n>    at most N accounts, oldest revocations first
  --apply        delete the accounts`);
  process.exit(0);
}

const days = Number(args.days);
const limit = args.limit === undefined ? undefined : Number(args.limit);
if (!(days > 0) || (limit !== undefined && !(limit > 0))) {
  console.error("--days and --limit must be positive numbers");
  process.exit(1);
}

const results = await purgeRevokedAccounts({ days, limit, verify: !args["no-verify"], apply: args.apply });

const day = (date: Date) => date.toISOString().slice(0, 10);
const label = {
  revoked: "still revoked",
  unverified: "not verified",
  valid: "token works again",
  unknown: "couldn't check",
};
console.table(
  results.map((result) => ({
    account: result.username,
    revoked: day(result.revokedAt),
    "last seen": day(result.lastSeen),
    check: label[result.status],
    deleted: result.deleted ? "yes" : "",
  }))
);

const deletable = results.filter((result) => result.status === "revoked" || result.status === "unverified").length;
const skipped = results.length - deletable;
console.log(
  args.apply
    ? `🧹 Deleted ${results.filter((result) => result.deleted).length} accounts, skipped ${skipped} that couldn't be confirmed`
    : `${deletable} accounts would be deleted (${skipped} skipped, couldn't confirm the revocation). Run again with --apply to delete them`
);
await disconnectDatabase();
