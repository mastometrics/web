import { A, useParams } from "@solidjs/router";
import { For, Show, Suspense } from "solid-js";
import { RouteDataArgs, useRouteData } from "solid-start";
import { createServerAction$, createServerData$ } from "solid-start/server";
import { ReblogIcon, ReplyIcon, StarIcon } from "~/components/Icon";
import { getFullAccount, syncAccount } from "~/db/account";

export function routeData({ params }: RouteDataArgs) {
  // console.log("params", params);
  // const account = getAccount(params.handle);
  const account = createServerData$(async ([handle]) => getFullAccount(handle), { key: () => [params.handle] });
  return { account };
}

export default function AccountHandleRoute() {
  const { account } = useRouteData<typeof routeData>();

  const [syncing, sync] = createServerAction$(syncAccount);
  const params = useParams();
  // console.log("params", params.handle);

  return (
    <div class="max-w-lg mx-auto my-6">
      <Suspense>
        <Show when={account()} keyed>
          {(acc) => (
            <div class=" bg-white shadow sm:rounded-lg">
              <div class="px-4 py-5 border-b border-gray-200 sm:px-6">
                <div class="-ml-4 -mt-4 flex justify-between items-center flex-wrap sm:flex-nowrap">
                  <div class="ml-4 mt-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <img class="h-12 w-12 rounded-full" src={acc.avatar!} alt="" />
                      </div>
                      <div class="ml-4">
                        <h3 class="text-lg leading-6 font-medium text-gray-900">{acc.displayName}</h3>
                        <p class="text-sm text-gray-500">
                          <a href="#"> {acc.username} </a>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 mt-4 flex-shrink-0 flex">
                    <button
                      type="button"
                      class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => sync(params.handle)}
                    >
                      <span> Update / Import </span>
                    </button>
                  </div>
                </div>
                {/* <>
              <h1>{acc.displayName}</h1>
              <For each={acc.Statuses}>{(status) => <div>{status.content}</div>}</For>
            </> */}
              </div>
              <div class="px-4 py-5  sm:px-6 grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-3 sm:divide-y-0 sm:divide-x ">
                <div class="px-2 py-2 text-sm font-medium text-center">
                  <span class="text-gray-900">{acc.followersCount}</span>
                  <div class="text-gray-600">Followers</div>
                </div>

                <div class="px-2 py-2 text-sm font-medium text-center">
                  <span class="text-gray-900 mr-1">{acc.followingCount}</span>
                  <div class="text-gray-600">Following</div>
                </div>

                <div class="px-2 py-2 text-sm font-medium text-center">
                  <span class="text-gray-900">{acc.statusesCount}</span>
                  <div class="text-gray-600">Posts</div>
                </div>
              </div>
            </div>
          )}
        </Show>
        <Show when={!account() && !account.loading} keyed>
          Not found <button onClick={() => sync(params.handle)}>Import account</button>
        </Show>

        <div class="bg-white shadow overflow-hidden sm:rounded-md mt-6">
          <ul role="list" class="divide-y divide-slate-200">
            <For each={account()?.Statuses}>
              {(status) => (
                <li class="px-4 py-4 sm:px-6">
                  <p class="text-gray-600">{status.content}</p>
                  <div class="flex gap-4   mt-2 text-sm">
                    {!!status.boostsCount && (
                      <div class="flex items-center text-slate-400">
                        {<ReblogIcon class="w-4 mr-1  inline-block" />} {status.boostsCount}
                      </div>
                    )}
                    {!!status.repliesCount && (
                      <div class="flex items-center text-slate-400">
                        {<ReplyIcon class="w-4 mr-1  inline-block" />} {status.repliesCount}
                      </div>
                    )}
                    {!!status.favoritesCount && (
                      <div class="flex items-center text-slate-400">
                        {<StarIcon class="w-4  mr-1 inline-block" />} {status.favoritesCount}
                      </div>
                    )}
                  </div>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Suspense>
      {/* <div class="flex">
          <button class="btn" onClick={() => sync(params.handle)}>
            Import account
          </button>
          <Show when={syncing.pending}>
            <div>Importing...</div>
          </Show>
        </div> */}
      {/* <A href="/accounts/robertvh@mas.to">robertvh@mas.to</A>
      <A href="/accounts/daan@twit.social">daan@twit.social</A> */}
    </div>
  );
}
