import { HandledError } from "../error";
import { createThrottler, createRateLimitStore } from "./throttler";
import { createHash } from "node:crypto";
import { logger } from "../logger";
import { safeFetch } from "./safe-fetch";
const throttler = createThrottler(createRateLimitStore());
export type ApiOptions = { throttle?: boolean; instance: string; token?: string };

export async function fetchApi<T>(
  path: string,
  { throttle, token, instance }: ApiOptions,
  request: RequestInit = {}
): Promise<{ data: T; response: Response }> {
  const url = path.toLowerCase().startsWith(`https://${instance.toLowerCase()}/api/v1/`)
    ? path
    : `https://${instance}/api/v1/${path}`;

  try {
    let key = instance;
    if (token) key += `-${createHash("sha256").update(token).digest("hex").slice(0, 8)}`;
    const { handleResponse } = await throttler.throttle(key, { greedy: !throttle });

    logger.debug(`🐘 GET ${url}`);

    const requestInit: RequestInit = { ...request, signal: AbortSignal.timeout(20 * 1000) };
    if (token) requestInit.headers = { ...request.headers, Authorization: `Bearer ${token}` };
    const response = await safeFetch(url, requestInit);

    const { ratelimitExceeded, awaitReset } = handleResponse(response);

    if (ratelimitExceeded) {
      await awaitReset();
      return fetchApi<T>(path, { throttle, token, instance }, request);
    }

    if (response.status >= 400) {
      const err = new HandledError(response.statusText, { cause: { response } });
      (err as any).status = response.status;
      throw err;
    }

    const data = (await response.json()) as T;
    return { data, response };
  } catch (err) {
    logger.warn(`🐘 Error fetching from ${instance} ${url} : ${(err as Error).message})`);
    if ((err as any).name === "TimeoutError") throw new HandledError(`Timeout to ${instance}`, { cause: err });
    if ((err as any).name === "AbortError") throw new HandledError(`Aborted request to ${instance}`, { cause: err });
    if ((err as any).code === "ECONNREFUSED") throw new Error(`Connection refused to ${instance}`, { cause: err });
    if ((err as any).code === "ECONNRESET") throw new Error(`Connection reset to ${instance}`, { cause: err });
    if ((err as any).status === 404)
      throw new HandledError(`Endpoint not found on ${instance}`, { cause: err, status: 404 });
    if ((err as any).status === 401)
      throw new HandledError(`Unauthorized request to ${instance}`, { cause: err, status: 401 });
    if ((err as any).status === 403)
      throw new HandledError(`Forbidden request to ${instance}`, { cause: err, status: 403 });
    throw err as Error;
  }
}

export async function* paginateApi<T>(
  path: string,
  options: ApiOptions,
  params?: { limit?: number },
  request?: RequestInit
): AsyncGenerator<T> {
  let next: string | undefined = path;
  let count = 0;
  do {
    const { data, response } = (await fetchApi<T[]>(next, options, request)) as { data: T[]; response: Response }; // https://github.com/microsoft/TypeScript/issues/36687
    if (data.length === 0) return;
    for (const item of data) {
      yield item;
      count++;
      if (params?.limit && count >= params.limit) return;
    }
    next = response.headers.get("Link")?.match(/<([^>]+)>; rel="next"/)?.[1];
  } while (next);
}

export const http = {
  fetch: fetchApi,
  paginate: paginateApi,
};
