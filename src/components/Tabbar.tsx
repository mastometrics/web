import { type Component, createSignal, createEffect, For, on } from "solid-js";
import { cls } from "~/lib/css";
import { Select } from "./Select";

type Tab = { title: string; key: string };
export const Tabbar: Component<{ tabs: Tab[]; active?: string; onChange: (tab: Tab) => void; class?: string }> = (
  props
) => {
  const [activeTab, setActiveTab] = createSignal(props.tabs.find((t) => t.key == props.active) ?? props.tabs[0]);
  createEffect(on(activeTab, (tab) => props.onChange(tab), { defer: true }));

  return (
    <div class={props.class}>
      <div class="sm:hidden">
        <Select
          options={props.tabs.map((t) => ({ label: t.title, value: t.key }))}
          value={activeTab().key}
          onChange={(key) => setActiveTab(props.tabs.find((t) => t.key == key)!)}
          label="Select a tab"
          hideLabel
          class="w-full"
        />
      </div>
      <div class="hidden sm:block">
        <nav class="flex space-x-4" aria-label="Tabs">
          <For each={props.tabs}>
            {(tab, i) => (
              <button
                class={cls(
                  activeTab() == tab
                    ? "bg-mastodon-purple-100 text-mastodon-purple-700 dark:bg-mastodon-purple-800 dark:text-mastodon-purple-100"
                    : "text-mastodon-purple-700/70 hover:text-mastodon-purple-800/60 dark:text-mastodon-purple-100/80 dark:hover:text-mastodon-purple-200/60",
                  "rounded-md px-3 py-2 text-sm font-medium"
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab.title}
              </button>
            )}
          </For>
        </nav>
      </div>
    </div>
  );
};
