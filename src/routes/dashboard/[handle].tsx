import { useParams } from "@solidjs/router";
import { Component, createEffect, createSignal, onMount, Show, Suspense } from "solid-js";
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
import { RouteAction } from "solid-start/data/createRouteAction";
import { Account } from "@prisma/client";
import { AccountMetadata, readMetadata } from "~/lib/metadata";
import { startSupport } from "~/lib/support";
import { Icons } from "~/components/Icon";
import { Box } from "~/components/Box";

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
    if ((await doImport(account()?.username!)) === true) window.location.reload();
  }

  onMount(() => {
    if (!account()?.tracking && user()?.account?.id == account()?.id) startTrackingAccount();
  });

  return (
    <>
      <Suspense fallback={<TinyLoadingIndicator />}>
        <Title>MastoMetrics - {account()?.displayName ?? params.handle}</Title>
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
                      <a href={`https://${account()?.instance}/@${account()?.username}`} target="_blank">
                        {account()?.username}
                      </a>
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
                  <div class="flex flex-wrap gap-2">
                    <UIButton onClick={() => sync(params.handle)} disabled={syncing.pending}>
                      Sync
                    </UIButton>
                    <UIButton onClick={() => doImport(params.handle)} disabled={importing.pending}>
                      {account()?.tracking ? "Reimport" : "Import"}
                    </UIButton>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
      <div class="container mx-auto max-w-4xl px-4 py-2 sm:py-4 sm:px-6">
        <ImportStatus account={account()!} importing={importing} />
        <AccountMetrics handle={params.handle} account={account} />
      </div>
      {account()?.tracking && (
        <div class="container mx-auto max-w-4xl sm:mb-12 sm:px-6">
          <AccountStatuses handle={params.handle} account={account} />
        </div>
      )}
    </>
  );
}

const ImportStatus: Component<{ account: Account; importing: RouteAction<any, boolean>[0] }> = (props) => {
  const estimated = () => estimateImportDuration(props.account?.statusesCount ?? 0);
  const [remaining, setRemaining] = createSignal(estimated().seconds);

  const activeImport = () => {
    const pending = readMetadata<AccountMetadata>(props.account?.metadata)?.pendingImport;
    if (pending) return new Date(pending);
  };

  createEffect(() => estimated().seconds && setRemaining(estimated().seconds));
  createEffect((prev) => {
    if (prev) return;
    if (estimated().seconds && activeImport()) {
      const remaining = Math.max(
        10 * 1000,
        (estimated().seconds - 20) * 1000 - (activeImport()!.getTime() - new Date().getTime())
      );
      setRemaining(remaining / 1000);
      setTimeout(() => window.location.reload(), remaining);
    }
    return true;
  }, false);

  return (
    <>
      {(activeImport() || props.importing.pending) && (
        <Box isSecondary>
          <div class="text-xl font-semibold  dark:text-mastodon-purple-400">
            <TinyLoadingIndicator class="mr-2" /> Setting up your account
          </div>
          <p class="my-4 leading-relaxed">
            We're importing {estimated().statuses} statuses and expect to be done in {formatDuration(remaining())}.
          </p>
          <p class="text-sm opacity-75">
            This tab will automatically refresh once done, you can also close it and check back later.
          </p>
        </Box>
      )}
      {props.importing.error && (
        <Box isError title="Import failed">
          <p class="my-4">{props.importing.error.message}</p>
          <UIButton onClick={() => props.importing.retry()}>
            <Icons.Reload class="mr-2 h-4 w-4" />
            Retry
          </UIButton>
          <UIButton onClick={() => startSupport(props.account)} class="ml-2">
            <Icons.At class="mr-2 h-4 w-4" />
            Support
          </UIButton>
        </Box>
      )}
    </>
  );
};

function estimateImportDuration(statusesCount: number) {
  const statuses = Math.min(statusesCount ?? 0, 2000);
  const pages = Math.ceil(statuses / 40);
  const seconds = 15 + Math.ceil((pages * 1.5) / 5) * 5; // 1.5 seconds per page at max 300 paging request per 15 minutes
  return { statuses, seconds };
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) return `${minutes} minutes and ${seconds % 60} seconds`;
  return `${seconds} seconds`;
}
