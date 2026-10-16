import { actions } from "astro:actions";
import { type Component, createSignal, onMount, Show } from "solid-js";
import { cls } from "~/lib/css";
import { parseInstance } from "~/lib/format";
import { ShowDelayed, TinyLoadingIndicator } from "./LoadingIndicator";

/** Submits to /auth/authorize, which redirects to the OAuth page of the instance */
export const LoginForm: Component<{
  error?: string;
  defaultInstance?: string;
  cta?: string;
  class?: string;
}> = (props) => {
  const [instance, setInstance] = createSignal(props.defaultInstance ?? "");
  const [pending, setPending] = createSignal(false);
  const [validation, setValidation] = createSignal<{ validInstance?: string; error?: string }>({});

  onMount(() => {
    if (!props.defaultInstance) setInstance(localStorage.getItem("preferedInstance") ?? "");
    // Reset the pending state when navigating back to this page
    window.addEventListener("pageshow", () => setPending(false));
  });

  async function validate(value?: string) {
    const host = parseInstance(value)?.toLowerCase();
    if (!host) return setValidation({});

    const { error } = await actions.validateInstance({ instance: host });
    if (error) return setValidation({ error: "Not a valid mastodon instance" });
    localStorage.setItem("preferedInstance", host);
    setValidation({ validInstance: host });
  }

  const label = () => props.cta ?? (props.error ? "Retry" : "Login");

  return (
    <form method="get" action="/auth/authorize" class={props.class} onSubmit={() => setPending(true)}>
      <div class="flex w-full flex-col items-center gap-4">
        <div class="border-mastodon-purple-200 from-mastodon-purple-100 focus-within:ring-mastodon-purple-500 flex w-full rounded-2xl border bg-linear-to-b to-white">
          <label class="block flex-auto">
            <span class="sr-only text-gray-700">Instance</span>
            <input
              type="text"
              name="instance"
              required
              autocomplete="username"
              value={instance()}
              onChange={(e) => validate(e.currentTarget.value)}
              onInput={(e) => {
                setInstance(e.currentTarget.value);
                setValidation({});
              }}
              class="form-input text-mastodon-purple-900 placeholder:text-mastodon-purple-500/50 block h-full w-full border-none bg-transparent px-4 ring-0 outline-hidden focus:ring-0"
              placeholder="user@mas.to"
            />
          </label>
          <button
            type="submit"
            class={cls(
              "relative m-1 h-auto place-self-stretch rounded-xl px-6 py-3 whitespace-nowrap text-white",
              "border-mastodon-purple-700 bg-mastodon-purple-600 from-mastodon-purple-600 to-mastodon-purple-700 border bg-linear-to-b",
              "outline-mastodon-purple-700 hover:from-mastodon-purple-700 hover:to-mastodon-purple-800 focus-visible:bg-mastodon-purple-800 disabled:bg-mastodon-purple-900/60 outline-offset-4 transition-all hover:shadow-md focus-visible:outline-2"
            )}
            disabled={pending()}
          >
            <ShowDelayed when={pending()} fallback={label()}>
              <TinyLoadingIndicator class="absolute inset-x-0 justify-center" />
              <span class="opacity-0">{label()}</span>
            </ShowDelayed>
          </button>
        </div>
        <div class="h-8 w-full">
          <Show when={validation().error} keyed>
            {(msg) => (
              <p role="alert" class="animate-in fade-in-0 text-sm whitespace-pre-line text-red-700 dark:text-red-400">
                {msg}
              </p>
            )}
          </Show>
          <Show when={validation().validInstance} keyed>
            {(host) => (
              <p role="status" class="animate-in fade-in-0 text-sm text-green-700 dark:text-green-400">
                {host} looks good!
              </p>
            )}
          </Show>
        </div>
      </div>
    </form>
  );
};
