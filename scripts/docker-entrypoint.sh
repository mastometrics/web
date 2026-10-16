#!/bin/sh
set -e

# Apply database migrations before starting, disable with RUN_MIGRATIONS=false
# (e.g. when running multiple replicas, run them once from a single container instead)
if [ "${RUN_MIGRATIONS:-true}" = "true" ] && [ "$DEPLOYMENT_TYPE" != "worker" ]; then
  echo "Applying database migrations"
  node_modules/.bin/prisma migrate deploy
fi

exec node scripts/start.mjs
