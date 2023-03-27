import { logger } from "../logger";
// https://github.com/mastodon/mastodon/blob/main/config/initializers/rack_attack.rb
// • 300 requests per 5 minutes per identifier (IP address (unauthenticated) or user token) = 1rps
// • 300 paging requests per 15 minutes by identifier = 1/3rps
type RateLimit = { limit?: number; remaining?: number; reset?: Date; history: Date[] };

function logVerbose(msg: string) {
  logger.debug("ℹ️ " + msg);
}

const THROTTLE_WHEN_PERCENTAGE_LEFT = 0.8,
  THROTTLE_WHEN_REMAINING = 100,
  THROTTLE_RPS_WHEN_RESET_UKNOWN = 1;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRateLimitStore() {
  const store = new Map<string, RateLimit>();
  function get(key: string) {
    return store.has(key) ? store.get(key)! : store.set(key, { history: [] }).get(key)!;
  }
  function update(key: string, limit: ReturnType<typeof readRateLimit>) {
    const l = get(key);
    l.history.push(new Date());
    l.remaining = limit.remaining;
    l.reset = limit.reset;
    l.limit = limit.limit;
    if (l.history.length > 50) l.history.shift();
    return l as Required<RateLimit>;
  }

  function garbageCollect() {
    const now = new Date();
    for (const [key, limit] of store.entries()) {
      if (!limit.reset || (limit.reset && limit.reset.valueOf() < now.valueOf() - 1000 * 60 * 1)) {
        store.delete(key);
        logVerbose(`Garbage collected rate limit for ${key}`);
      }
    }
  }

  setInterval(garbageCollect, 1000 * 60 * 1);

  return { get, update };
}

export function createThrottler({ get, update }: ReturnType<typeof createRateLimitStore>) {
  async function throttle(key: string, { greedy } = { greedy: false }) {
    function handleResponse(response: Response): { ratelimitExceeded: boolean; awaitReset: () => Promise<unknown> } {
      const limit = update(key, readRateLimit(response));
      if (response.status === 429) {
        const timeToReset = limit.reset.getTime() - Date.now();
        if (timeToReset) {
          logVerbose(`${key}: Rate limited, retry when timer resets in ${timeToReset / 1000} seconds`);
          const awaitReset = () => sleep(limit.reset.getTime() - Date.now());
          return { awaitReset, ratelimitExceeded: true };
        }
      }
      return { ratelimitExceeded: false, awaitReset: () => Promise.resolve() };
    }

    const { remaining, limit, reset, history } = get(key);
    if (
      remaining === undefined ||
      limit === undefined || // no rate limit info, just proceed
      remaining === limit || // we have a full bucket, just proceed
      (greedy && remaining > 0) || // we're in a greedy mode and have some tokens, just proceed
      (remaining > limit * THROTTLE_WHEN_PERCENTAGE_LEFT && remaining > THROTTLE_WHEN_REMAINING) // if  we have at least 50% and 50 tokens of the bucket left, we can proceed
    ) {
      logVerbose(`${key}: Passed throttling threshold, remaining: ${remaining}, limit: ${limit}, greedy: ${greedy}`);
      return { handleResponse };
    }

    if (reset === undefined) {
      logVerbose(`Passed throttling threshold, unknown reset, throttle for ${THROTTLE_RPS_WHEN_RESET_UKNOWN} seconds`);
      await sleep(1000 / THROTTLE_RPS_WHEN_RESET_UKNOWN);
    } else {
      const timeToReset = reset.getTime() - Date.now();
      const timePerToken = Math.max(timeToReset / remaining, 500);
      logVerbose(
        `${key}: Passed throttling threshold, throttle for ${timePerToken}ms per token, reset in ${
          timeToReset / 1000
        } seconds`
      );
      await sleep(timePerToken);
    }
    return { handleResponse };
  }

  return { throttle };
}

function readRateLimit(response: Response) {
  const limit = Number(response.headers.get("X-RateLimit-Limit"));
  const remaining = Number(response.headers.get("X-RateLimit-Remaining"));
  const reset = new Date(response.headers.get("X-RateLimit-Reset") ?? "");
  return { limit, remaining, reset };
}
