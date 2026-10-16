# MastoMetrics

Analytics for Mastodon. Track the growth of your Mastodon account, see which posts perform well and who you interact with most.

MastoMetrics is built with [Astro](https://astro.build), [SolidJS](https://solidjs.com) islands, [Tailwind CSS](https://tailwindcss.com) and [Prisma](https://prisma.io) on PostgreSQL. It consists of two processes:

- **app**: the web application (Astro, server rendered on Node.js)
- **worker**: a background job that periodically syncs tracked accounts with their Mastodon instances

Both are started by `npm start` (or the Docker image) by default, but can run separately to scale them independently.

## Self-hosting

### Requirements

- A server with Docker (recommended), or Node.js 22.22+ and PostgreSQL 14+
- A domain with HTTPS (a reverse proxy such as Caddy, Traefik or nginx in front of the app)

Users sign in with their Mastodon account through OAuth. MastoMetrics registers itself as an app on each instance automatically on first sign in, there's nothing to configure on the Mastodon side.

### With Docker Compose (recommended)

1. Clone the repository and create a `.env` file:

   ```bash
   git clone https://github.com/mastometrics/web.git mastometrics
   cd mastometrics
   cp .env.dist .env
   ```

2. Fill in the required values in `.env`:

   ```bash
   SESSION_SECRET="$(openssl rand -base64 32)"      # signs session cookies
   POSTGRES_PASSWORD="$(openssl rand -base64 24)"   # database password
   SITE_URL="https://metrics.example.com"           # the public URL of your deployment
   ```

   `DATABASE_URL` is not needed, docker compose builds it from `POSTGRES_PASSWORD`.

3. Start everything:

   ```bash
   docker compose up -d
   ```

   This builds the image, starts PostgreSQL, applies the database migrations and starts the app and worker on port `4321` (change it with `PORT` in `.env`).

4. Point your reverse proxy at `http://localhost:4321`. For example with Caddy:

   ```
   metrics.example.com {
     reverse_proxy localhost:4321
   }
   ```

5. Open your `SITE_URL` and sign in with your Mastodon account.

To update, pull the latest changes and run `docker compose up -d --build`. Migrations are applied automatically on start.

### Without Docker

```bash
cp .env.dist .env               # fill in DATABASE_URL, SESSION_SECRET and SITE_URL
npm ci
npm run build
npm run db:migrate              # apply database migrations
HOST=0.0.0.0 npm start          # starts the app and the worker, loads .env automatically
```

Use a process manager (systemd, pm2, ...) to keep `npm start` running. The app listens on `HOST:PORT` (default `localhost:4321`), which can also be passed as flags:

```bash
npm start -- --port 3000 --host 0.0.0.0   # app and worker
npm run start:app -- --port 3000          # only the web app
npm run start:worker                      # only the worker
```

### Using an existing image / separate processes

The Docker image runs the app and the worker in one container by default. Set `DEPLOYMENT_TYPE` to split them, for example to run several app replicas with a single worker:

| `DEPLOYMENT_TYPE` | Runs                         |
| ----------------- | ---------------------------- |
| `default`         | web app and worker (default) |
| `app`             | only the web app             |
| `worker`          | only the background worker   |

Only one worker should run at a time. Migrations run on start of containers that serve the app, set `RUN_MIGRATIONS=false` to disable that and run `npx prisma migrate deploy` yourself.

The health check endpoint is `GET /internal-api/health`.

### Becoming an admin

Admins can see all accounts at `/admin` and trigger syncs manually. Sign in once, then grant yourself the role in the database:

```bash
docker compose exec db psql -U mastometrics -c \
  "UPDATE users SET roles = '{admin}' FROM accounts WHERE users.\"accountId\" = accounts.id AND accounts.username = 'you@your.instance';"
```

### Configuration

All configuration happens through environment variables, read at runtime. See [`.env.dist`](./.env.dist) for the full list.

| Variable                       | Description                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `DATABASE_URL`                 | PostgreSQL connection string (required)                                            |
| `SESSION_SECRET`               | Secret used to sign session cookies (required)                                     |
| `SITE_URL`                     | Public URL, used for the OAuth redirect and social previews (strongly recommended) |
| `APP_NAME`                     | Name shown on the Mastodon authorization screen, defaults to `MastoMetrics`        |
| `CONTACT_HANDLE`               | Mastodon account for support and contact links, defaults to `MastoMetrics@mas.to`  |
| `SHOW_DONATION_BANNER`         | Show the ko-fi donation banner of the original author, defaults to `false`         |
| `DEPLOYMENT_TYPE`              | `default`, `app` or `worker`, see above                                            |
| `MAINTENANCE_MODE`             | `true` disables sign in, the dashboard and the worker                              |
| `LOG_LEVEL`                    | `debug`, `info` (default), `warning` or `error`                                    |
| `WORKER_SYNC_INTERVAL_MINS`    | Run the sync job every N minutes (default `2`)                                     |
| `WORKER_SYNC_OUTDATED_MINS`    | Sync accounts again after N minutes (default `45`)                                 |
| `WORKER_SYNC_MAX_STATUS_COUNT` | Number of recent posts updated per sync (default `120`)                            |

### Database

MastoMetrics needs PostgreSQL 14 or newer. The database in the Docker Compose setup works out of the box, but storage and backups are still up to you. If you bring your own (managed) database, check all of these points:

- **Extensions and privileges**: the first migration runs `CREATE EXTENSION IF NOT EXISTS citext`. The user running migrations must be allowed to create that extension (or a superuser creates it once beforehand) and to create tables. At runtime the app only reads and writes rows. To run the app with a restricted user, set `RUN_MIGRATIONS=false` and apply migrations with a privileged user: `DATABASE_URL="<admin url>" npx prisma migrate deploy`.
- **SSL certificates**: the `pg` driver treats `sslmode=require` as `verify-full`, so the server certificate must be signed by a trusted CA. Many managed databases (DigitalOcean, AWS RDS, ...) use their own CA, which fails with `P1011` / `self-signed certificate in certificate chain`. Either:
  - download the CA certificate and add `&sslrootcert=/path/to/ca-certificate.crt` (mount the file into the container when using Docker), or
  - add `&uselibpqcompat=true`, which makes `sslmode=require` behave like `psql`: the connection is encrypted, but the certificate is not verified.
- **Connection limits**: every process has its own pool of up to 10 connections. A default deployment (app and worker) uses up to 20, and every extra app replica adds 10 more. Small managed database plans often allow only 20-25 connections, so lower or raise the pool with the `connection_limit` parameter, e.g. `...?sslmode=require&connection_limit=5`.
- **Pool timeout**: the worker syncs many accounts at once, so queries regularly wait for a free connection. After `pool_timeout` seconds (default `30`, `0` waits forever) they fail with `timeout exceeded when trying to connect`. If that shows up in the logs, raise `connection_limit` (if the database allows it) or `pool_timeout`.
- **Connection poolers**: migrations need a direct connection. If `DATABASE_URL` points to PgBouncer or another pooler in transaction mode, run `prisma migrate deploy` against the database directly.
- **Latency**: run the app, the worker and the database in the same region. Imports and syncs write each post with its own query, and an import can contain up to 2,000 posts. At 1-2 ms per query that takes seconds; across continents (150+ ms) it takes minutes.
- **Storage**: plan for roughly 10 MB per tracked account. Most of it is posts (including the raw API response) and interactions, and it keeps growing for as long as accounts are tracked. For reference, mastometrics.com uses about 92 GB for 7,000 accounts: 64 GB posts, 18 GB interactions, 7 GB metrics.
- **Backups**: the database is the only state MastoMetrics keeps, so back it up regularly. With Docker Compose: `docker compose exec db pg_dump -U mastometrics mastometrics > backup.sql`. Keep `SESSION_SECRET` as well; changing it signs everyone out.

You will probably want to review the [privacy policy](./src/pages/privacy.astro) and [FAQ](./src/pages/faq.astro) pages, as they describe the hosted version at mastometrics.com.

### Impact on Mastodon instances

The worker only syncs accounts that signed up, uses the access token of the user and respects (and anticipates) the rate limits of each instance. Syncing an account takes around 5 requests every 45 minutes, the initial import up to 100 requests spread over several minutes.

## Contributing

Contributions are welcome! For bigger changes, please open an issue first so we can discuss the approach.

### Setting up

You need Node.js 22.22+ (24 recommended) and a PostgreSQL database. The easiest way to get one is Docker:

```bash
git clone https://github.com/mastometrics/web.git mastometrics
cd mastometrics
npm install                        # also generates the Prisma client

docker run -d --name mastometrics-db -p 127.0.0.1:5432:5432 \
  -e POSTGRES_USER=mastometrics -e POSTGRES_PASSWORD=password -e POSTGRES_DB=mastometrics postgres:17-alpine

cp .env.dist .env                  # the default DATABASE_URL matches the container above, set a SESSION_SECRET
npm run db:migrate                 # create the tables
npm run dev                        # web app on http://localhost:4321
npm run dev:worker                 # (optional) background worker, in a second terminal
```

There are two ways to use the dashboard locally:

- **Demo data**: `npm run db:seed` fills a **local** database with demo accounts and prints session cookies for a demo admin and a regular user. Set one as the `mm_session` cookie on `localhost`.
- **Your own Mastodon account**: keep `SITE_URL="http://localhost:4321"` and sign in. MastoMetrics registers a development app on your instance with that redirect URL. Grant yourself the admin role with the SQL from [Becoming an admin](#becoming-an-admin).

### Scripts

| Command                  | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `npm run dev`            | Dev server with hot reloading (`-- --port 3000` for another port)          |
| `npm run dev:worker`     | Worker, restarts on changes                                                |
| `npm run check`          | Type check `.ts`, `.tsx` and `.astro` files                                |
| `npm test`               | Run the tests (see below)                                                  |
| `npm run format`         | Format everything with Prettier                                            |
| `npm run build`          | Production build of the app (`dist/server`) and worker (`dist/worker.mjs`) |
| `npm start`              | Run the production build                                                   |
| `npm run db:migrate:dev` | Create a migration after changing `prisma/schema.prisma`                   |
| `npm run db:migrate`     | Apply migrations                                                           |
| `npm run db:seed`        | Fill a local database with demo data                                       |

### How it fits together

- **Pages** (`src/pages`) are rendered on the server. They load data with functions from `src/backend` and pass it as `initial` props to SolidJS islands (`client:load`), so pages render complete without loading spinners.
- **Islands** (`src/components`) load more data (other periods, tabs, pagination) through **Astro Actions** (`src/actions/index.ts`). Every action checks permissions first. A `HandledError` thrown in the backend becomes an error message for the user, anything else is logged and shown as a generic error.
- **Backend functions** usually return `[result, error]` tuples through `useDatabase`. `throwOnError` unwraps them. `db` is a lazily connected Prisma client.
- **The worker** (`src/worker.ts`) runs the cron jobs from `src/workers/schedule.ts`: it syncs outdated accounts every 2 minutes and requeues stuck syncs every hour. Initial imports run in the web app: the dashboard starts one through the `importAccount` action when a new user first opens it.
- **Mastodon API calls** go through `src/lib/mastodon`, which throttles requests per instance based on the rate limit headers.
- **Configuration** is read from environment variables at runtime in `src/lib/config.ts`. New variables go there, into `.env.dist` and into the [configuration table](#configuration).
- **Sessions** are stored in a signed `mm_session` cookie (`src/backend/session.ts`), and `src/middleware.ts` puts the signed in user on `Astro.locals.user`.

### Database changes

Change `prisma/schema.prisma`, then run `npm run db:migrate:dev -- --name describe-your-change`. This creates a SQL migration in `prisma/migrations` and regenerates the client. Commit the migration together with the schema. Keep in mind that existing deployments have a lot of data (see [Database](#database)), so prefer migrations that don't rewrite large tables such as `statuses` and `interactions`.

### Tests

Tests run against a PostgreSQL database that is wiped on every run, so never point them at a database with real data. The easiest way is a throwaway container:

```bash
docker run -d --name mastometrics-test-db -p 127.0.0.1:55432:5432 \
  -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=mastometrics_test postgres:17-alpine

npm run build    # optional, enables the end-to-end HTTP tests
npm test
```

Set `TEST_DATABASE_URL` to use another database (defaults to `postgresql://test:test@127.0.0.1:55432/mastometrics_test`). The tests and the seed script refuse to run against non-local databases.

- `tests/lib.test.ts`: helpers without a database (formatting, sessions, permissions, HTML sanitizing)
- `tests/backend.test.ts`: backend functions against the database
- `tests/workers.test.ts`: imports and syncs, with Mastodon mocked in `tests/mastodon-mock.ts`
- `tests/http.test.ts`: starts the production build and checks pages, redirects and actions over HTTP

### Before opening a pull request

- `npm run check`, `npm test` and `npx prettier --check .` pass (CI runs the type check, build and tests).
- New behavior comes with a test where practical.
- New configuration is documented in `.env.dist` and this README.
- UI changes work on mobile and in dark mode.

### Project structure

```
src/
  actions/      Astro actions, the API used by the interactive islands
  backend/      Database access and server-only logic
  components/   SolidJS components (islands) and Astro components
  layouts/      Page layouts
  lib/          Shared helpers, Mastodon API client, configuration
  pages/        Routes
  workers/      Background sync jobs
  worker.ts     Entry point of the worker process
prisma/         Database schema and migrations
tests/          Vitest unit, database and HTTP tests
scripts/        Production launcher, Docker entrypoint and seed script
```

## Upgrading from the SolidStart version

The database schema is unchanged, existing databases work as is. Some things to note when upgrading an existing deployment:

- **SSL connections**: Prisma now connects through the `pg` driver, which treats `sslmode=require` as `verify-full`. Managed databases with their own CA (e.g. DigitalOcean) fail to connect with that. Either add the CA certificate or append `&uselibpqcompat=true` to `DATABASE_URL` to keep the previous behavior, see [Database](#database).
- **Connection pool**: `connection_limit` and `pool_timeout` in `DATABASE_URL` still work. The default pool is now 10 connections per process instead of a number based on the CPU count.
- **Environment variables** are now read at runtime and some were renamed: `VITE_MAINTENANCE_MODE` → `MAINTENANCE_MODE`, `VITE_DEPLOYMENT_TYPE` → `DEPLOYMENT_TYPE`. `LOGSNAG_TOKEN` is no longer used.
- Set **`SITE_URL`** to the same origin as before (e.g. `https://mastometrics.com`), the OAuth redirect URI of the apps registered on instances is based on it. If it changes, apps are registered again on the next sign in, which is harmless.
- Set `SHOW_DONATION_BANNER=true` to keep showing the ko-fi banner.
- Users need to **sign in again** once, the session cookie format changed.
- Node.js 22.22 or newer is required.

## License

See [LICENSE](./LICENSE).
