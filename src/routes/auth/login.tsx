import { createLocalStorage, createStorageSignal } from "@solid-primitives/storage";
import { Component, createEffect, createSignal, Show } from "solid-js";
import { FormError, Title, useLocation, useRouteData } from "solid-start";
import server$, { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { ShowDelayed, TinyLoadingIndicator } from "~/components/LoadingIndicator";
import { Page } from "~/components/Page";
import { findOrCreateInstance, getInstanceAppCredentials } from "~/backend/instance";
import { getUser } from "~/backend/session";
import { HandledError } from "~/lib/error";
import { parseHandle } from "~/lib/format";
import { mastodonApi } from "~/lib/mastodon/api";
import { Box } from "~/components/Box";
import { RouteAction } from "solid-start/data/createRouteAction";
import { cls } from "~/lib/css";

export function createLoginAction() {
  return createServerAction$(async (form: FormData, event) => {
    const input = form.get("instance");
    if (typeof input !== "string") throw new FormError(`Form not submitted correctly.`);

    try {
      const inputInstance = parseInstance(input);
      if (!inputInstance) throw new FormError(`Please enter an instance`);
      try {
        await mastodonApi({ instance: inputInstance }).instance.info();
      } catch (error) {
        if (error instanceof HandledError) throw new FormError(error.message);
        console.error(error);
        throw new FormError("Not a valid mastodon instance");
      }

      const [instance, error] = await findOrCreateInstance(inputInstance);
      if (error) throw new FormError(error.message);
      const [credentials, err] = await getInstanceAppCredentials(instance, {
        redirectUri: `${new URL(event.request.url).origin}/auth/connect?instance=${instance.host}`,
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
}

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const user = await getUser(request);
    if (user?.account) throw redirect(`/dashboard/${user.account!.username}`);
    return {};
  });
}

export default function LoginRoute() {
  const user = useRouteData<typeof routeData>();
  const params = useLocation().query;
  user();

  const [login, { Form }] = createLoginAction();

  return (
    <Page title="Login">
      <Show when={params.error}>
        <Box isError class="mx-auto my-6 max-w-2xl">
          <p>{params.error}</p>
        </Box>
      </Show>
      <div class="mx-auto my-6 max-w-2xl rounded-lg bg-white p-4 shadow-lg shadow-mastodon-purple-600/10 dark:bg-mastodon-purple-700 sm:p-8">
        {/* {user()?.account && <p>Logged in as {user()?.account!.username}</p>} */}
        <Title>Login</Title>
        <h1 class="mb-4 text-2xl font-semibold text-mastodon-purple-600 dark:text-mastodon-purple-100">Welcome!</h1>
        <p class="my-2 text-mastodon-purple-900/60 dark:text-mastodon-purple-200">
          Enter your mastodon instance or username, to continue to MastoMetrics,
          <br />
        </p>

        <Form class="mt-4">
          <LoginForm loginForm={login} defaultInstance={params.instance} error={params.error} />
        </Form>
        <p class="mt-4 max-w-prose text-sm leading-relaxed text-mastodon-purple-900/70  dark:text-mastodon-purple-200">
          If this is your first time using MastoMetrics, you will be asked to authorize the app.
          <br />
          Learn more about the data we store in our{" "}
          <a href="/faq" class="text-mastodon-purple-500 dark:text-mastodon-purple-300">
            FAQ
          </a>
          .
        </p>
        <ul class="my-2 list-inside list-disc space-y-2 text-sm leading-relaxed text-mastodon-purple-900/70 marker:text-mastodon-purple-400 dark:text-mastodon-purple-200">
          <li>We only need read permissions</li>
          <li>We dont't need your email address</li>
          <li>We don't send spam</li>
        </ul>
      </div>
    </Page>
  );
}

export type loginFormSignal = RouteAction<FormData, Response>[0];
export const LoginForm: Component<{
  error?: string;
  defaultInstance?: string;
  loginForm: loginFormSignal;
  cta?: string;
}> = (props) => {
  const [instance, setInstance] = createStorageSignal("preferedInstance", props.defaultInstance ?? "");
  const [validation, setValidation] = createSignal<{ validInstance?: string; error?: string }>({});

  async function validate(value?: string) {
    const instance = parseInstance(value)?.toLowerCase();
    if (!instance) return setValidation({});

    try {
      await server$((instance: string) => mastodonApi({ instance }).instance.info())(instance);
      setInstance(instance);
    } catch (error) {
      setValidation({ error: "Not a valid mastodon instance" });
      return;
    }

    setValidation({ validInstance: instance });
  }

  createEffect(() => {
    if (props.loginForm.error?.message) setValidation({ error: props.loginForm.error.message });
  });

  createEffect(() => props.defaultInstance && setInstance(props.defaultInstance));

  return (
    <div class="flex w-full flex-col items-center gap-4">
      <div class="flex w-full rounded-2xl border border-mastodon-purple-200 bg-gradient-to-b from-mastodon-purple-100 to-white focus-within:ring-mastodon-purple-500">
        <label class="block flex-auto">
          <span class="sr-only text-gray-700">Instance</span>
          <input
            type="text"
            name="instance"
            value={instance() ?? ""}
            onChange={(e) => validate(e.currentTarget.value)}
            onInput={(e) => setValidation({})}
            class="form-input block h-full w-full border-none bg-transparent px-4 text-mastodon-purple-900 outline-none ring-0 placeholder:text-mastodon-purple-500/50 focus:ring-0 "
            placeholder="user@mas.to"
          />
        </label>
        <button
          type="submit"
          class={cls(
            "m-1 h-auto  place-self-stretch whitespace-nowrap rounded-xl py-3 px-6 text-white ",
            "border border-mastodon-purple-700 bg-mastodon-purple-600 bg-gradient-to-b from-mastodon-purple-600 to-mastodon-purple-700",
            "outline-offset-4 outline-mastodon-purple-700 transition-all hover:from-mastodon-purple-700 hover:to-mastodon-purple-800 hover:shadow-md  focus-visible:bg-mastodon-purple-800 focus-visible:outline-2 disabled:bg-mastodon-purple-900/60  "
          )}
          disabled={props.loginForm.pending}
        >
          <ShowDelayed
            when={props.loginForm.pending}
            fallback={props.cta ?? (props.error || props.loginForm.error ? "Retry" : "Login")}
          >
            <TinyLoadingIndicator class="absolute mx-auto" />
            <span class="opacity-0">{props.cta ?? (props.error || props.loginForm.error ? "Retry" : "Login")}</span>
          </ShowDelayed>
        </button>
      </div>
      <div class="h-8 w-full">
        <Show when={validation().error} keyed>
          {(msg) => (
            <p role="alert" class="text-sm text-red-700 animate-in fade-in-0 dark:text-red-400">
              {msg}
            </p>
          )}
        </Show>
        <Show when={validation().validInstance} keyed>
          {(instance) => (
            <p role="alert" class="text-sm text-green-700 animate-in fade-in-0 dark:text-green-400">
              {instance} looks good!
            </p>
          )}
        </Show>
      </div>
    </div>
  );
};

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
