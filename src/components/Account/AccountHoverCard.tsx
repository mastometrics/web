import { HoverCard as KBHoverCard } from "@kobalte/core/hover-card";
import { actions } from "astro:actions";
import {
  type Component,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  type JSX,
  type ParentComponent,
  Show,
  splitProps,
  Suspense,
} from "solid-js";
import { formatNumber, parseHandle } from "~/lib/format";
import type { MastodonAccount } from "~/lib/mastodon/types";
import { formatEmojis, sanitizeMastodonHtmlWithEmojis } from "~/lib/mastodon/html";
import { Icons } from "../Icon";

export const AccountLink: ParentComponent<
  | (JSX.AnchorHTMLAttributes<HTMLAnchorElement> & { account: { username: string } })
  | (JSX.AnchorHTMLAttributes<HTMLAnchorElement> & { username: string })
> = (props) => {
  const [local, rest] = splitProps(props, ["children", "account", "username"] as any);
  const username = () => ("account" in props ? props.account.username : props.username);
  const [triggered, setTriggered] = createSignal(false);

  const [account] = createResource(
    () => triggered() && username(),
    (handle) => lookupAccount(handle).catch(() => actions.lookupAccount.orThrow({ handle }))
  );

  return (
    <KBHoverCard placement="right-start" arrowPadding={40} gutter={4} onOpenChange={() => setTriggered(true)}>
      <KBHoverCard.Trigger href={accountHref(username())} target="_blank" rel="noopener noreferrer" {...rest}>
        {props.children}
      </KBHoverCard.Trigger>
      <KBHoverCard.Portal>
        <Suspense>
          <KBHoverCard.Content
            class="border-mastodon-purple-200 bg-mastodon-purple-50 shadow-mastodon-purple-900/10 animate-in fade-in zoom-in dark:border-mastodon-purple-700 dark:bg-mastodon-purple-800 max-w-[90vw] origin-top-left rounded-lg border whitespace-normal shadow-lg sm:max-w-md"
            style={{ "transform-origin": "var(--kb-hovercard-content-transform-origin)" }}
          >
            <KBHoverCard.Arrow />
            <ErrorBoundary
              fallback={(e) => (
                <div class="m-1 bg-red-500/20 p-6 dark:text-white">
                  <p>
                    <Icons.AlertTriangleFilled class="mr-2 inline" /> Could not load account preview
                  </p>
                  <p class="mt-2 text-sm opacity-70">{e.message}</p>
                </div>
              )}
            >
              {account() && <AccountCard account={account()!} handle={username()} />}
            </ErrorBoundary>
          </KBHoverCard.Content>
        </Suspense>
      </KBHoverCard.Portal>
    </KBHoverCard>
  );
};

const AccountCard: Component<{ account: MastodonAccount; handle?: string }> = (props) => {
  function format(textWithEmojis: string) {
    return formatEmojis(textWithEmojis, props.account.emojis);
  }

  function formatHtml(html: string) {
    return sanitizeMastodonHtmlWithEmojis(new DOMParser(), html, props.account.emojis);
  }

  return (
    <div class="relative">
      <Show when={props.account.header} keyed>
        {(h) => (
          <div class="relative -mb-32 aspect-[2/1] w-full overflow-hidden">
            <img src={h} class="h-full w-full rounded-t-lg object-cover opacity-70" alt="" />
            <div class="via-mastodon-purple-50/70 to-mastodon-purple-50 dark:via-mastodon-purple-800/70 dark:to-mastodon-purple-800 absolute right-0 bottom-0 left-0 h-60 bg-linear-to-b from-transparent"></div>
          </div>
        )}
      </Show>
      <div class="relative z-10 flex flex-col gap-4 p-6">
        <div class="flex items-center">
          <img
            src={props.account.avatar}
            class="border-mastodon-purple-50 dark:border-mastodon-purple-800 h-16 w-16 rounded-lg border-2 object-cover"
            alt=""
          />
          <div class="ml-4">
            <div
              class="text-mastodon-purple-800 text-lg font-bold dark:text-white"
              innerHTML={format(props.account.display_name)}
            ></div>
            <a
              class="text-mastodon-purple-700 dark:text-mastodon-purple-200"
              target="_blank"
              href={props.account.url}
              rel="noopener noreferrer"
            >
              @{props.account.username}
              <span class="opacity-60">@{parseHandle(props.handle ?? props.account.username).instance}</span>
            </a>
          </div>
        </div>

        <div class="text-md text-mastodon-purple-800 dark:text-mastodon-purple-200 flex flex-wrap gap-4">
          <CountWithLabel count={props.account.followers_count} label="Followers" />
          <CountWithLabel count={props.account.following_count} label="Following" />
          <CountWithLabel count={props.account.statuses_count} label="Posts" />
        </div>

        <div
          class="dark:text-mastodon-purple-50 text-sm text-gray-500"
          innerHTML={formatHtml(props.account.note)}
        ></div>

        {props.account.fields?.length > 0 && (
          <div class="flex flex-wrap gap-4">
            <For each={props.account.fields ?? []}>
              {(field) => (
                <div class="min-w-0">
                  <div class="text-mastodon-purple-700 dark:text-mastodon-purple-100 text-xs font-semibold uppercase">
                    <span innerHTML={format(field.name)} />
                    {field.verified_at && (
                      <Icons.Verified class="text-mastodon-purple-500 dark:text-mastodon-purple-300 mb-0.5 ml-1 inline h-3 w-3 align-middle" />
                    )}
                  </div>
                  <div class="min-w-0 truncate text-sm" innerHTML={formatHtml(field.value)} />
                </div>
              )}
            </For>
          </div>
        )}
      </div>
    </div>
  );
};

const CountWithLabel: Component<{ count: number; label: string }> = (props) => {
  return (
    <>
      {props.count && (
        <p>
          <strong class="dark:text-white">{formatNumber(props.count)}</strong> {props.label}
        </p>
      )}
    </>
  );
};

function accountHref(handle: string) {
  const { acct, instance } = parseHandle(handle);
  return `https://${instance}/@${acct}`;
}

/** Look up the account directly from the browser, the server action is used as fallback (i.e. when CORS fails) */
async function lookupAccount(handle: string) {
  const { instance } = parseHandle(handle);
  const response = await fetch(`https://${instance}/api/v1/accounts/lookup?acct=${encodeURIComponent(handle)}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Could not load account (${response.status})`);
  return (await response.json()) as MastodonAccount;
}
