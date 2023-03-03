import { useParams } from "@solidjs/router";
import { onMount, Show, Suspense } from "solid-js";
import { RouteDataArgs, Title, useRouteData } from "solid-start";
import { createServerAction$, createServerData$, redirect, ServerError } from "solid-start/server";
import { TinyLoadingIndicator } from "~/components/LoadingIndicator";
import { getFullAccount, startTracking, syncAccount } from "~/backend/account";
import { formatRelativeTime } from "~/lib/format";
import { useAuthentication } from "~/backend/authentication";
import { usePermissions } from "~/lib/permissions";
import { AccountStatuses } from "~/components/Account/AccountStatuses";
import { AccountMetrics } from "~/components/Account/AccountMetrics";
import { UIButton } from "~/components/Button";

export function routeData({ params }: RouteDataArgs) {
  const user = createServerData$(async (_, { request }) => useAuthentication(request));
  const account = createServerData$(
    async (handle, { request }) => {
      const user = await useAuthentication(request);
      if (!usePermissions(user).account.view(handle)) throw redirect(`/dashboard/${user?.account?.username}`);
      const [data, err] = await getFullAccount(handle);
      if (err) throw err;
      return data?.account;
    },
    {
      key: () => params.handle,
    }
  );

  return {
    user,
    account,
  };
}

export default function AccountHandleRoute() {
  const { user, account } = useRouteData<typeof routeData>();
  const params = useParams();
  const permissions = usePermissions(user());

  const [syncing, sync] = createServerAction$((handle: string) => syncAccount(handle));
  const [importing, doImport] = createServerAction$(async (handle: string, { request }) => {
    const user = await useAuthentication(request);
    if (usePermissions(user).account.edit(handle)) return startTracking(handle);
    throw new ServerError("You are not allowed to track this account", { status: 403 });
  });

  async function startTrackingAccount() {
    if (await doImport(account()?.username!)) window.location.reload();
  }

  onMount(() => {
    if (!account()?.tracking && user()?.account?.id == account()?.id) startTrackingAccount();
  });

  return (
    <>
      <Suspense fallback={<TinyLoadingIndicator />}>
        <Title>MastoMetrics - {account()?.displayName ?? params.handle}</Title>
        <Show when={account()}>
          <div class="bg-mastodon-purple-100/90 dark:bg-mastodon-purple-800/10">
            <div class="container mx-auto max-w-4xl py-8 px-6">
              <div class="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
                <div class="ml-4 mt-4">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <img class="h-16 w-16 rounded-md" src={account()?.avatar!} alt={account()?.displayName!} />
                    </div>
                    <div class="ml-4">
                      <h3 class="text-lg font-medium leading-6 text-mastodon-purple-800 dark:text-mastodon-purple-100 sm:text-xl">
                        {account()?.displayName}
                      </h3>
                      <p class="text-sm text-mastodon-purple-900/50 dark:text-mastodon-purple-300 sm:text-base">
                        <a href="#"> {account()?.username} </a>
                      </p>
                      {account()?.lastIndex && (
                        <p class="mt-2 text-xs text-mastodon-purple-800/50 dark:text-mastodon-purple-200 sm:hidden">
                          Last updated {formatRelativeTime(account()?.lastIndex!)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div class="ml-4 mt-4 flex flex-shrink-0 flex-col items-end gap-2">
                  {account()?.lastIndex && (
                    <p class="hidden text-xs text-mastodon-purple-800/50 dark:text-mastodon-purple-200 sm:block ">
                      Last updated {formatRelativeTime(account()?.lastIndex!)}
                    </p>
                  )}
                  <Show when={permissions.manage()}>
                    <div class="flex-wrap gap-4">
                      {!account()?.tracking && (
                        <UIButton onClick={() => doImport(params.handle)} disabled={importing.pending}>
                          Start Tracking
                        </UIButton>
                      )}
                      <UIButton onClick={() => sync(params.handle)} disabled={syncing.pending}>
                        Sync
                      </UIButton>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </Suspense>

      <div class="container mx-auto max-w-4xl px-4 py-2 sm:py-4 sm:px-6">
        <AccountMetrics handle={params.handle} account={account} />

        {account()?.tracking == false && importing.pending && (
          <div class="my-8 rounded-lg bg-mastodon-purple-200/50  px-5 py-6 text-mastodon-purple-800  dark:bg-mastodon-purple-800/40 dark:text-white sm:px-6">
            <TinyLoadingIndicator /> Importing account data
          </div>
        )}
        {importing.error && (
          <div class="my-8 rounded-lg bg-mastodon-purple-200/50  px-5 py-6 text-mastodon-purple-800  dark:bg-mastodon-purple-800/40 dark:text-white sm:px-6">
            {importing.error.message}
          </div>
        )}
      </div>
      <AccountStatuses handle={params.handle} account={account} />
    </>
  );
}
