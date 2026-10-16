import { type Component, Switch, Match, createSignal, Show } from "solid-js";
import { cls } from "~/lib/css";
import { formatDate, formatNumber } from "~/lib/format";
import { Icons } from "./Icon";
import { SimpleChart } from "./SimpleChart";

export const StatCard: Component<{
  title: string;
  values: { date: Date; value: number }[];
}> = (props) => {
  const [hoverIndex, setHoverIndex] = createSignal<number>();

  const currentValue = () => props.values.at(-1)?.value;
  const previousValue = () => props.values.at(-2)?.value;
  const dates = (): Date[] => props.values?.map((v) => v.date) || [];
  const data = () => props.values.map((v) => v.value) || [];

  return (
    <div
      class="bg-mastodon-purple-100 dark:bg-mastodon-purple-800 relative min-h-[9em] overflow-hidden rounded-lg px-4 py-5 sm:p-6"
      onMouseLeave={() => setHoverIndex(undefined)}
    >
      <div class="pointer-events-none relative z-10">
        <dt
          class={cls(
            "dark:text-mastodon-purple-300 truncate text-sm font-medium text-gray-500 transition-all",
            hoverIndex() == undefined ? "mt-0 opacity-100" : "-mt-8 opacity-0"
          )}
        >
          {props.title}
        </dt>
        <dd class="mt-1 flex items-baseline">
          <p
            class={cls(
              "text-mastodon-purple-900 text-3xl font-semibold transition-all dark:text-white",
              hoverIndex() == undefined ? "text-3xl" : "text-2xl"
            )}
          >
            {formatNumber(hoverIndex() != undefined ? data()[hoverIndex()!] : (currentValue() ?? 0))}
          </p>
          <Show when={previousValue() != undefined}>
            <Show
              when={hoverIndex() != undefined}
              fallback={<DeltaLabel value={currentValue()} compareTo={props.values.at(-2)?.value} />}
            >
              <DeltaLabel value={data()[hoverIndex()!]} compareTo={data()[hoverIndex()! - 1]} />
            </Show>
          </Show>
        </dd>
        <dt
          class={cls(
            "dark:text-mastodon-purple-300 mt-1 -mb-6 truncate text-sm font-medium text-gray-500 transition",
            hoverIndex() == undefined ? "opacity-0" : "opacity-100"
          )}
        >
          {hoverIndex() != undefined ? formatDate(dates()[hoverIndex()!]) : <>&nbsp;</>}
        </dt>
      </div>
      <Show when={previousValue() != undefined}>
        <div class="text-mastodon-purple-300 absolute top-auto right-0 bottom-0 left-0 h-auto w-full overflow-hidden rounded-b-lg p-0.5">
          <SimpleChart
            data={data()}
            height={"80px"}
            onHover={(_, i) => setHoverIndex(i)}
            lineColor="rgba(99 100 255 / 40%)"
            areaColor="rgba(99 100 255 / 4%)"
          />
        </div>
      </Show>
    </div>
  );
};

const DeltaLabel: Component<{ value?: number; compareTo?: number }> = (props) => {
  const change = () => (props.value ?? 0) - (props.compareTo ?? 0);
  const type = () => (change() > 0 ? "increase" : change() < 0 ? "decrease" : "same");
  return (
    <p class="bg-mastodon-purple-100/70 dark:bg-mastodon-purple-800/50 flex items-baseline rounded-full px-2 text-sm font-semibold">
      <Switch
        fallback={
          <>
            <Icons.Dash class="h-4 w-4 shrink-0 self-center text-gray-300" />
            <span class="sr-only"> No change </span>
            {/* <span class="text-gray-500">{0}</span> */}
          </>
        }
      >
        <Match when={type() == "increase"}>
          <Icons.ArrowUp class="h-4 w-4 shrink-0 self-center text-green-500" />
          <span class="sr-only"> Increased by </span>
          <span class="text-green-600 dark:text-green-400">{change()}</span>
        </Match>
        <Match when={type() == "decrease"}>
          <Icons.ArrowDown class="h-4 w-4 shrink-0 self-center text-red-500" />
          <span class="sr-only"> Decreased by </span>
          <span class="text-red-600 dark:text-red-500">{Math.abs(change())}</span>
        </Match>
      </Switch>
    </p>
  );
};
