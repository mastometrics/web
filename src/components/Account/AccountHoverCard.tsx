import { HoverCard as KBHoverCard } from "@kobalte/core";
import { Account } from "@prisma/client";
import {
  Component,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  JSX,
  ParentComponent,
  Show,
  splitProps,
  Suspense,
} from "solid-js";
import server$ from "solid-start/server";
import { formatNumber, parseHandle } from "~/lib/format";
import { MastodonAccount, mastodonApi } from "~/lib/mastodon/api";
import { formatEmojis, simpleMastodonSanitzer } from "~/lib/mastodon/utils";
import { Icons } from "../Icon";

export const AccountLink: ParentComponent<
  | (JSX.ButtonHTMLAttributes<HTMLAnchorElement> & { account: Account })
  | (JSX.ButtonHTMLAttributes<HTMLAnchorElement> & { username: string })
> = (props) => {
  const [local, rest] = splitProps(props, ["children", "account", "username"] as any);
  const username = () => ("account" in props ? props.account.username : props.username);
  const [triggered, setTriggered] = createSignal(false);

  const [account] = createResource(
    () => triggered() && username(),
    (handle) => lookupAccount(handle).catch(() => server$(lookupAccount)(handle))
  );

  return (
    <KBHoverCard.Root placement="right-start" arrowPadding={40} gutter={4} onOpenChange={() => setTriggered(true)}>
      <KBHoverCard.Trigger href={accountHref(username())} target="_blank" rel="noopener noreferrer" {...rest}>
        {props.children}
      </KBHoverCard.Trigger>
      <KBHoverCard.Portal>
        <Suspense>
          <KBHoverCard.Content
            class="max-w-[90vw] origin-top-left whitespace-normal rounded-lg border border-mastodon-purple-200 bg-mastodon-purple-50 shadow-lg shadow-mastodon-purple-900/10 animate-in fade-in zoom-in dark:border-mastodon-purple-700 dark:bg-mastodon-purple-800 sm:max-w-md"
            style={{ "transform-origin": "var(--kb-hovercard-content-transform-origin);" }}
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
    </KBHoverCard.Root>
  );
};

const AccountCard: Component<{ account: MastodonAccount; handle?: string }> = (props) => {
  function format(textWithEmojis: string, safe = false) {
    return formatEmojis(textWithEmojis, props.account.emojis, safe);
  }

  function formatHtml(html: string) {
    return formatEmojis(simpleMastodonSanitzer(html), props.account.emojis, true);
  }

  return (
    <div class="relative">
      <Show when={props.account.header} keyed>
        {(h) => (
          <div class="relative -mb-32 aspect-[2/1] w-full overflow-hidden">
            <img src={h} class="h-full w-full rounded-t-lg object-cover opacity-70" />
            <div class="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-b from-transparent via-mastodon-purple-50/70 to-mastodon-purple-50 dark:via-mastodon-purple-800/70 dark:to-mastodon-purple-800 "></div>
          </div>
        )}
      </Show>
      <div class="relative z-10 flex flex-col gap-4 p-6">
        <div class="flex items-center">
          <img
            src={props.account.avatar}
            class="h-16 w-16 rounded-lg border-2 border-mastodon-purple-50 object-cover dark:border-mastodon-purple-800 "
          />
          <div class="ml-4">
            <div
              class="text-lg font-bold text-mastodon-purple-800 dark:text-white"
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

        <div class="text-md flex flex-wrap gap-4 text-mastodon-purple-800 dark:text-mastodon-purple-200">
          <CountWithLabel count={props.account.followers_count} label="Followers" />
          <CountWithLabel count={props.account.following_count} label="Following" />
          <CountWithLabel count={props.account.statuses_count} label="Posts" />
        </div>

        <div
          class="text-sm text-gray-500 dark:text-mastodon-purple-50"
          innerHTML={formatHtml(props.account.note)}
        ></div>

        {props.account.fields?.length > 0 && (
          <div class="flex flex-wrap gap-4">
            <For each={props.account.fields ?? []}>
              {(field) => (
                <div class="min-w-0">
                  <div class="text-xs font-semibold uppercase text-mastodon-purple-700 dark:text-mastodon-purple-100">
                    <span innerHTML={format(field.name)} />
                    {field.verified_at && (
                      <Icons.Verified class="ml-1 mb-0.5 inline h-3 w-3 align-middle text-mastodon-purple-500 dark:text-mastodon-purple-300 " />
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

async function lookupAccount(handle: string) {
  const { instance } = parseHandle(handle);
  return mastodonApi({ instance }).accounts.lookup(handle);
}
