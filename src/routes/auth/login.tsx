import { createEffect, createSignal, Show } from "solid-js";
import { FormError, Title, useLocation, useRouteData } from "solid-start";
import server$, { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { TinyLoadingIndicator } from "~/components/LoadingIndicator";
import { Page } from "~/components/Page";
import { findOrCreateInstance, getInstanceAppCredentials } from "~/db/instance";
import { getUser } from "~/db/session";
import { parseHandle } from "~/lib/format";
import { fetchInstance } from "~/lib/mastodon";

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const [user, error] = await getUser(request);
    if (user) throw redirect(`/dashboard/${user.account!.username}`);

    return {};
  });
}

function parseInstance(input?: string) {
  try {
    if (!input) return;
    if (input.includes("@")) {
      const { instance } = parseHandle(input.trim());
      return instance;
    }

    if (input.includes("://")) {
      const url = new URL(input);
      return url.hostname;
    } else return input;
  } catch {
    return input;
  }
}

export default function LoginRoute() {
  const user = useRouteData<typeof routeData>();
  const params = useLocation().query;
  user();

  const [validation, setValidation] = createSignal<{ validInstance?: string; error?: string }>({});

  async function validate(value?: string) {
    const instance = parseInstance(value)?.toLowerCase();
    if (!instance) return setValidation({});

    try {
      await server$((instance: string) => fetchInstance({ instance }))(instance);
    } catch (error) {
      setValidation({ error: "Not a valid mastodon instance" });
      return;
    }

    setValidation({ validInstance: instance });
  }

  const [loggingIn, { Form }] = createServerAction$(async (form: FormData, event) => {
    const input = form.get("instance");
    if (typeof input !== "string") throw new FormError(`Form not submitted correctly.`);

    try {
      const inputInstance = parseInstance(input);
      if (!inputInstance) throw new FormError(`Please enter an instance`);
      try {
        await fetchInstance({ instance: inputInstance });
      } catch {
        throw new FormError("Not a valid mastodon instance");
      }

      const [instance, error] = await findOrCreateInstance(inputInstance);
      if (error) throw new FormError(error.message);
      const [credentials, err] = await getInstanceAppCredentials(instance, {
        redirectUri: `http://localhost:3000/auth/connect?instance=${instance.host}`,
      });
      if (err) throw new FormError(err.message);

      return redirect(
        `https://${instance.host}/oauth/authorize?client_id=${credentials.clientId}&redirect_uri=${
          credentials.redirectUri
        }&response_type=code&scope=${"read"}`
      );
    } catch (error) {
      if (error instanceof FormError) throw error;
      throw new FormError(`Something went wrong while trying to log you in.`);
    }
  });

  createEffect(() => {
    if (loggingIn.error?.message) setValidation({ error: loggingIn.error.message });
  });

  return (
    <Page title="Login">
      <Show when={params.error}>
        <p role="alert" class="mx-auto max-w-2xl rounded bg-red-500/10 px-4 py-6 text-center text-red-700">
          {params.error}
        </p>
      </Show>
      <div class="mx-auto my-6 max-w-2xl rounded-lg bg-white p-4 shadow-lg shadow-mastodon-purple-600/10 sm:p-8">
        {/* {user()?.account && <p>Logged in as {user()?.account!.username}</p>} */}
        <Title>Login</Title>
        <h1 class="mb-4 text-2xl font-semibold text-mastodon-purple-600">Welcome!</h1>
        <p class="my-2 text-mastodon-purple-900/60">
          Enter your mastodon instance or username, to continue to MastoMetrics,
          <br />
        </p>

        <Form class="mt-4">
          <div class="flex flex-wrap items-center gap-4 ">
            <label class="block flex-auto">
              <span class="sr-only text-gray-700">Instance</span>
              <input
                type="text"
                name="instance"
                value={params.instance ?? ""}
                onChange={(e) => validate(e.currentTarget.value)}
                onInput={(e) => setValidation({})}
                class="form-input block w-full rounded-md border-mastodon-purple-200 bg-mastodon-purple-50 text-mastodon-purple-900 placeholder:text-mastodon-purple-500/50 focus:ring-mastodon-purple-500"
                placeholder="user@mas.to"
              />
            </label>
            <button
              type="submit"
              class="h-10 w-full min-w-[6em] place-self-stretch rounded-md bg-mastodon-purple-600 px-6 text-white shadow shadow-mastodon-purple-900/10 outline-mastodon-purple-900 transition-all hover:bg-mastodon-purple-700 hover:shadow-md focus-visible:bg-mastodon-purple-800 focus-visible:outline-2 disabled:bg-mastodon-purple-900/60 sm:h-auto sm:w-auto"
              disabled={loggingIn.pending}
            >
              {loggingIn.pending ? <TinyLoadingIndicator /> : params.error || loggingIn.error ? "Retry" : "Login"}
            </button>
            <div class="h-8 w-full">
              <Show when={validation().error} keyed>
                {(msg) => (
                  <p role="alert" class="text-sm text-red-700 animate-in fade-in-0">
                    {msg}
                  </p>
                )}
              </Show>
              <Show when={validation().validInstance} keyed>
                {(instance) => (
                  <p role="alert" class="text-sm text-green-700 animate-in fade-in-0">
                    {instance} looks good!
                  </p>
                )}
              </Show>
            </div>
          </div>
        </Form>
        <p class="mt-4 max-w-prose text-sm leading-relaxed text-mastodon-purple-900/70">
          If this is your time using MastoMetrics, you will be asked to authorize the app.
          <br />
          Learn more about the data we store in our{" "}
          <a href="/faq" class="text-mastodon-purple-500">
            FAQ
          </a>
          .
        </p>
        <ul class="my-2 list-inside list-disc space-y-2 text-sm leading-relaxed text-mastodon-purple-900/70 marker:text-mastodon-purple-400">
          <li>We only need read permissions</li>
          <li>We dont't need your email address</li>
          <li>We don't send spam</li>
        </ul>
      </div>
    </Page>
  );
}
