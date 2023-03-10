import { createEffect, createSignal, Match, Switch } from "solid-js";
import { Title, useRouteData } from "solid-start";
import { createServerAction$, createServerData$, ServerError } from "solid-start/server";
import { useAuthentication } from "~/backend/authentication";
import { Box } from "~/components/Box";
import { UIButton } from "~/components/Button";
import { deleteAccount as doDeleteAccount } from "~/backend/account";
import { usePermissions } from "~/lib/permissions";
import { Icons } from "~/components/Icon";
import { TinyLoadingIndicator } from "~/components/LoadingIndicator";
export function routeData() {
  const user = createServerData$(async (_, { request }) => useAuthentication(request));

  const [deletingAccount, deleteAccount] = createServerAction$(async (handle: string, { request }) => {
    if (usePermissions(await useAuthentication(request)).account.edit(handle)) {
      Promise.all([doDeleteAccount(handle), new Promise((resolve) => setTimeout(resolve, 500))]);
      return true;
    }
    throw new ServerError("You are not allowed to delete this account", { status: 403 });
  });

  return { user, deletingAccount, deleteAccount };
}

export default function SettingsRoute() {
  const { user, deletingAccount, deleteAccount } = useRouteData<typeof routeData>();
  const [showDelete, setShowDelete] = createSignal(false);

  createEffect(() => {
    if (deletingAccount.result === true) window.setTimeout(() => (window.location.href = "/auth/logout"), 1000);
  });

  return (
    <div class="container mx-auto max-w-4xl px-4 py-2 sm:py-4 sm:px-6">
      <Title>Settings - MastoMetrics</Title>

      {!showDelete() ? (
        <Box title="Account Settings">
          <p>You are signed in as {user()?.account.username}</p>
          <p class="my-4 opacity-50">No settings available yet.</p>
          <UIButton onClick={() => setShowDelete(true)}>
            <Icons.Trash class="mr-2" /> Delete my account
          </UIButton>
        </Box>
      ) : (
        <Box title="Delete your account?" isError>
          <p class=" max-w-prose">
            Confirm to instantly delete your account and all associated data from MastoMetrics.
          </p>
          <small class="my-4 block max-w-prose text-sm leading-snug opacity-80">
            You might also want to remove the MastoMetrics app from your Mastodon Account settings. Note that just
            revoking the app will only pause syncing and deleting your account here is the most effective way to ensure
            complete removal of your data. Accounts with revoked app access will only be deleted after 30 days.
          </small>
          <div>
            <div class="flex h-10 items-center">
              <Switch
                fallback={
                  <UIButton onClick={() => deleteAccount(user()?.account.username!)}>
                    <Icons.Check class="mr-2" /> Yes, please delete my account
                  </UIButton>
                }
              >
                <Match when={deletingAccount.pending}>
                  <TinyLoadingIndicator class="mx-2 text-red-600" />
                  <p class="font-bold text-red-600">Deleting account...</p>
                </Match>
                <Match when={deletingAccount.error}>
                  <p class="font-bold text-red-600">{deletingAccount.error.message}</p>
                </Match>
                <Match when={deletingAccount.result == true}>
                  <TinyLoadingIndicator class="mx-2 text-green-600" />
                  <p class="font-bold text-green-600">Account deleted, logging out now</p>
                </Match>
              </Switch>
            </div>
            <p class="my-4 max-w-prose text-xs">
              👋 Thanks for trying out MastoMetrics! If you have any feedback or questions, or would like to share your
              reason for deleting your account, please{" "}
              <a href="https://mas.to/@MastoMetrics" target="_blank" class="text-red-600">
                let me know
              </a>
              .
            </p>
          </div>
        </Box>
      )}
    </div>
  );
}
