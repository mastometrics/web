import { Show } from "solid-js";
import { FormError, Title, useLocation, useRouteData } from "solid-start";
import { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { findOrCreateInstance, getInstanceAppCredentials } from "~/db/instance";
import { getUser } from "~/db/session";

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const [user, error] = await getUser(request);
    if (user) throw redirect(`/dashboard/${user.account!.username}`);

    return {};
  });
}

export default function LoginRoute() {
  const user = useRouteData<typeof routeData>();
  user();

  const params = useLocation().query;

  const [loggingIn, { Form }] = createServerAction$(async (form: FormData, event) => {
    const input = form.get("instance");
    if (typeof input !== "string") throw new FormError(`Form not submitted correctly.`);

    try {
      const [instance, error] = await findOrCreateInstance(input);
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
      throw new FormError(`Could not find instance`);
    }
  });
  return (
    <div class="max-w-4xl mx-auto my-6 rounded bg-white shadow-lg p-8">
      {/* {user()?.account && <p>Logged in as {user()?.account!.username}</p>} */}
      <Title>Login</Title>
      <h1 class="text-2xl font-bold">Login</h1>
      <p class="text-gray-600">Enter your mastodon instance or username</p>
      <Show when={params.error}>
        <p role="alert" id="error-message">
          {params.error}
        </p>
      </Show>
      <Form class="mt-4">
        <div class="flex flex-col space-y-2">
          <label class="block">
            <span class="text-gray-700">Instance</span>
            <input
              type="text"
              name="instance"
              value={params.instance ?? ""}
              class="form-input mt-1 block w-full"
              placeholder="https://mastodon.social"
            />
          </label>
        </div>

        <Show when={loggingIn.error}>
          <p role="alert" id="error-message">
            {loggingIn.error.message}
          </p>
        </Show>
        <button type="submit" class="mt-4 btn btn-primary">
          {params.error ? "Retry" : "Login"}
        </button>
      </Form>
    </div>
  );
}
