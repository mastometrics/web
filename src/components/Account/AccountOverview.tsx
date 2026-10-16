import { actions } from "astro:actions";
import { type Component, createEffect, createSignal, onMount, Show } from "solid-js";
import { estimateImportDuration, formatDuration } from "~/lib/dashboard";
import { formatDateTime } from "~/lib/format";
import { startSupport } from "~/lib/support";
import { Box } from "../Box";
import { UIButton } from "../Button";
import { Icons } from "../Icon";
import { TinyLoadingIndicator } from "../LoadingIndicator";

export type OverviewAccount = {
  id: number;
  username: string;
  instance: string;
  tracking: boolean;
  statusesCount: number | null;
  pendingImport?: string;
  suspendedSync?: string;
};

/** Sync/import buttons for admins */
export const AdminAccountActions: Component<{ account: OverviewAccount }> = (props) => {
  const [pending, setPending] = createSignal<string>();
  const [error, setError] = createSignal<string>();

  async function run(name: string, action: () => Promise<{ error?: { message: string } }>) {
    setPending(name);
    setError(undefined);
    const { error } = await action();
    setPending(undefined);
    if (error) setError(error.message);
    else window.location.reload();
  }

  const handle = () => ({ handle: props.account.username });

  return (
    <div class="flex flex-col items-end gap-2">
      <div class="flex flex-wrap gap-2">
        <UIButton onClick={() => run("sync", () => actions.syncAccount(handle()))} disabled={!!pending()}>
          Sync
        </UIButton>
        <UIButton onClick={() => run("interactions", () => actions.syncInteractions(handle()))} disabled={!!pending()}>
          Sync interactions
        </UIButton>
        <UIButton onClick={() => run("import", () => actions.importAccount(handle()))} disabled={!!pending()}>
          {props.account.tracking ? "Reimport" : "Import"}
        </UIButton>
      </div>
      <Show when={pending()}>
        <TinyLoadingIndicator class="text-mastodon-purple-500" />
      </Show>
      <Show when={error()}>
        <p class="text-sm text-red-600">{error()}</p>
      </Show>
    </div>
  );
};

/** Starts the initial import for new accounts and shows the import/suspended state */
export const AccountSetup: Component<{ account: OverviewAccount; isOwnAccount: boolean }> = (props) => {
  const [importing, setImporting] = createSignal(false);
  const [importError, setImportError] = createSignal<string>();

  async function startTrackingAccount() {
    setImporting(true);
    setImportError(undefined);
    const { data, error } = await actions.importAccount({ handle: props.account.username });
    setImporting(false);
    if (error) setImportError(error.message);
    else if (data === true) window.location.reload();
  }

  onMount(() => {
    if (!props.account.tracking && props.isOwnAccount) startTrackingAccount();
  });

  return (
    <>
      <Show when={props.account.suspendedSync}>
        {(suspended) => (
          <Box isError title="Data syncing suspended">
            <p>
              Since {formatDateTime(suspended())} we are no longer syncing data for this account. Typically this is
              because your instance denied access to MastoMetrics, for example because the MastoMetrics app has been
              revoked in your Mastodon account settings.
            </p>
            <p class="my-4">
              To resolve this issue, please first log out and in again and then retry. If the issue persists, please
              contact support.
            </p>
            <UIButton onClick={() => startTrackingAccount()} disabled={importing()}>
              <Icons.Reload class="mr-2 h-4 w-4" />
              Retry
            </UIButton>
            <UIButton onClick={() => startSupport(props.account)} class="ml-2">
              <Icons.At class="mr-2 h-4 w-4" />
              Support
            </UIButton>
          </Box>
        )}
      </Show>
      <ImportStatus
        account={props.account}
        importing={importing()}
        error={importError()}
        retry={startTrackingAccount}
      />
    </>
  );
};

const ImportStatus: Component<{
  account: OverviewAccount;
  importing: boolean;
  error?: string;
  retry: () => void;
}> = (props) => {
  const estimated = () => estimateImportDuration(props.account.statusesCount ?? 0);
  const [remaining, setRemaining] = createSignal(estimated().seconds);

  const activeImport = () => (props.account.pendingImport ? new Date(props.account.pendingImport) : undefined);

  createEffect(() => estimated().seconds && setRemaining(estimated().seconds));
  onMount(() => {
    const started = activeImport();
    if (estimated().seconds && started) {
      const remaining = Math.max(10 * 1000, (estimated().seconds - 20) * 1000 - (Date.now() - started.getTime()));
      setRemaining(remaining / 1000);
      setTimeout(() => window.location.reload(), remaining);
    }
  });

  return (
    <>
      {(activeImport() || props.importing) && (
        <Box isSecondary>
          <div class="dark:text-mastodon-purple-400 text-xl font-semibold">
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
      {props.error && (
        <Box isError title="Import failed">
          <p class="mb-4">{props.error}</p>
          <UIButton onClick={() => props.retry()}>
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
