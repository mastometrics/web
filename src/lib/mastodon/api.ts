import fetch, { RequestInit, Response } from "node-fetch";
import { createThrottler, createRateLimitStore } from "./throttler";

const throttler = createThrottler(createRateLimitStore());
export type ApiOptions = { throttle?: boolean; instance: string; token?: string };

export async function fetchFromApi<T>(
  path: string,
  { throttle, token, instance }: ApiOptions,
  request: RequestInit = {}
): Promise<{ data: T; response: Response }> {
  try {
    let key = instance;
    if (token) key += `-${token}`;

    const { handleResponse } = await throttler.throttle(key, { greedy: !throttle });

    const url = `https://${instance}/api/v1/${path}`;
    const requestInit = { ...request };
    if (token) requestInit.headers = { ...request.headers, Authorization: `Bearer ${token}` };
    const response = await fetch(url, requestInit);

    const { limited, waitForReset } = handleResponse(response);

    if (limited) {
      await waitForReset;
      return fetchFromApi(instance, { throttle, token, instance }, request);
    }

    if (response.status >= 400) {
      const err = new Error(response.statusText, { cause: { response } });
      (err as any).status = response.status;
      throw err;
    }

    const data = (await response.json()) as T;
    return { data, response: response };
  } catch (err) {
    if ((err as any).code === "ECONNREFUSED") throw new Error(`Connection refused to ${instance}`);
    if ((err as any).code === "ECONNRESET") throw new Error(`Connection reset to ${instance}`);
    throw err as Error;
  }
}

// 429 Too Many Requests
async function test(instance = "swiss.social") {
  let count = 0;
  while (count < 200) {
    try {
      const { response } = await fetchFromApi("instance", {
        throttle: true,
        instance,
      });
      if (response.status !== 200) console.log(response.status, response.statusText);
    } catch (e) {
      console.log(e);
    }
    count++;
  }
}
