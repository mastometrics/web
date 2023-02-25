import fetch, { RequestInit, Response } from "node-fetch";
import { createThrottler, createRateLimitStore } from "./throttler";

const throttler = createThrottler(createRateLimitStore());
export type ApiOptions = { throttle?: boolean; instance: string; token?: string; logger?: (msg: string) => void };

export async function fetchApi<T>(
  path: string,
  { throttle, token, instance, logger }: ApiOptions,
  request: RequestInit = {}
): Promise<{ data: T; response: Response }> {
  try {
    logger ??= console.log;
    let key = instance;
    if (token) key += `-${token}`;
    const { handleResponse } = await throttler.throttle(key, { greedy: !throttle });
    const url = path.startsWith(`https://${instance}/api/v1/`) ? path : `https://${instance}/api/v1/${path}`;

    logger(`Fetching ${url}`);

    const requestInit = { ...request };
    if (token) requestInit.headers = { ...request.headers, Authorization: `Bearer ${token}` };
    const response = await fetch(url, requestInit);

    const { ratelimitExceeded, awaitReset } = handleResponse(response);

    if (ratelimitExceeded) {
      await awaitReset();
      return fetchApi(instance, { throttle, token, instance }, request);
    }

    if (response.status >= 400) {
      const err = new Error(response.statusText, { cause: { response } });
      (err as any).status = response.status;
      throw err;
    }

    const data = (await response.json()) as T;
    return { data, response };
  } catch (err) {
    if ((err as any).code === "ECONNREFUSED") throw new Error(`Connection refused to ${instance}`);
    if ((err as any).code === "ECONNRESET") throw new Error(`Connection reset to ${instance}`);
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
    await new Promise((resolve) => setTimeout(resolve, 200));
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
