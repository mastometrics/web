import { onMount } from "solid-js";

/**
 * Wrap a resource fetcher so the first call returns data that was already loaded by the
 * server (passed into an island as a prop) instead of fetching it again.
 * `useInitial` can reject the initial data, e.g. when it was computed for different params.
 *
 * Must be called inside a component. When the resource is hydrated from serialized SSR state the
 * fetcher is never called for the initial params, so the initial data is dropped after mounting
 * to make sure it's never returned for other params.
 */
export function withInitialData<P, T>(
  initial: T | undefined,
  fetcher: (params: P) => Promise<T>,
  useInitial: (params: P) => boolean = () => true
) {
  let pending = initial;
  onMount(() => (pending = undefined));
  return (params: P): T | Promise<T> => {
    const value = pending;
    pending = undefined;
    if (value !== undefined && useInitial(params)) return value;
    return fetcher(params);
  };
}
