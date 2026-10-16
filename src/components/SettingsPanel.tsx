import { actions } from "astro:actions";
import { type Component, createSignal, Match, Switch } from "solid-js";
import { Box } from "./Box";
import { UIButton } from "./Button";
import { Icons } from "./Icon";
import { TinyLoadingIndicator } from "./LoadingIndicator";

export const SettingsPanel: Component<{ username: string; contactUrl: string }> = (props) => {
  const [showDelete, setShowDelete] = createSignal(false);
  const [state, setState] = createSignal<{ pending?: boolean; error?: string; deleted?: boolean }>({});

  async function deleteAccount() {
    setState({ pending: true });
    const [{ error }] = await Promise.all([
      actions.deleteAccount({ handle: props.username }),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
    if (error) return setState({ error: error.message });
    setState({ deleted: true });
    window.setTimeout(() => (window.location.href = "/auth/logout"), 1000);
  }

  return (
    <>
      {!showDelete() ? (
        <Box title="Account Settings">
          <p>You are signed in as {props.username}</p>
          <p class="my-4 opacity-50">No settings available yet.</p>
          <UIButton onClick={() => setShowDelete(true)}>
            <Icons.Trash class="mr-2" /> Delete my account
          </UIButton>
        </Box>
      ) : (
        <Box title="Delete your account?" isError>
          <p class="max-w-prose">Confirm to instantly delete your account and all associated data from MastoMetrics.</p>
          <small class="my-4 block max-w-prose text-sm leading-snug opacity-80">
            You might also want to remove the MastoMetrics app from your Mastodon Account settings. Note that just
            revoking the app will only pause syncing and deleting your account here is the most effective way to ensure
            complete removal of your data. Accounts with revoked app access will only be deleted after 30 days.
          </small>
          <div>
            <div class="flex h-10 items-center">
              <Switch
                fallback={
                  <UIButton onClick={() => deleteAccount()}>
                    <Icons.Check class="mr-2" /> Yes, please delete my account
                  </UIButton>
                }
              >
                <Match when={state().pending}>
                  <TinyLoadingIndicator class="mx-2 text-red-600" />
                  <p class="font-bold text-red-600">Deleting account...</p>
                </Match>
                <Match when={state().error}>
                  <p class="font-bold text-red-600">{state().error}</p>
                </Match>
                <Match when={state().deleted}>
                  <TinyLoadingIndicator class="mx-2 text-green-600" />
                  <p class="font-bold text-green-600">Account deleted, logging out now</p>
                </Match>
              </Switch>
            </div>
            <p class="my-4 max-w-prose text-xs">
              👋 Thanks for trying out MastoMetrics! If you have any feedback or questions, or would like to share your
              reason for deleting your account, please{" "}
              <a href={props.contactUrl} target="_blank" class="text-red-600">
                let me know
              </a>
              .
            </p>
          </div>
        </Box>
      )}
    </>
  );
};
