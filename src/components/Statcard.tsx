import { Component, Switch, Match, onMount, createSignal, Show } from "solid-js";
import { cls } from "~/lib/css";
import { formatDate, formatNumber } from "~/lib/format";
import { DashIcon, ArrowUpIcon, ArrowDownIcon } from "./Icon";
import { SimpleChart } from "./SimpleChart";

export const StatCard: Component<{
  title: string;
  values: { date: Date; value: number }[];
}> = (props) => {
  const [hoverIndex, setHoverIndex] = createSignal<number>();

  const currentValue = () => props.values.at(-1)?.value;
  const previousValue = () => props.values.at(-2)?.value;
  const dates: Date[] = props.values?.map((v) => v.date) || [];
  const data = () => props.values.map((v) => v.value) || [];

  return (
    <div
      class="px-4 py-5 bg-mastodon-purple-100 rounded-lg overflow-hidden min-h-[9em] sm:p-6 relative"
      onMouseLeave={() => setHoverIndex(undefined)}
    >
      <div class="relative z-10 pointer-events-none">
        <dt
          class={cls(
            "text-sm font-medium text-gray-500 truncate transition-all",
            hoverIndex() == undefined ? "opacity-100 mt-0" : "opacity-0 -mt-8"
          )}
        >
          {props.title}
        </dt>
        <dd class="mt-1 flex items-baseline ">
          <p
            class={cls(
              "transition-all text-3xl font-semibold text-mastodon-purple-900",
              hoverIndex() == undefined ? "text-3xl" : "text-2xl"
            )}
          >
            {formatNumber(hoverIndex() != undefined ? data()[hoverIndex()!] : currentValue() ?? 0)}
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
            "mt-1 -mb-6 text-sm font-medium text-gray-500 truncate transition",
            hoverIndex() == undefined ? "opacity-0 " : "opacity-100"
          )}
        >
          {hoverIndex() != undefined ? formatDate(dates[hoverIndex()!]) : <>&nbsp;</>}
        </dt>
      </div>
      <Show when={previousValue() != undefined}>
        <div class="w-full h-auto bottom-0 top-auto right-0 left-0 absolute rounded-b-lg overflow-hidden p-0.5">
          <SimpleChart
            data={data()}
            height={"80px"}
            onHover={(_, i) => setHoverIndex(i)}
            lineColor="rgba(99 100 255 / 30%)"
            areaColor="rgba(99 100 255 / 5%)"
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
    <p class="px-2 flex items-baseline text-sm font-semibold bg-mastodon-purple-100/70 rounded-full">
      <Switch
        fallback={
          <>
            <DashIcon class="self-center flex-shrink-0 h-4 w-4 text-gray-300" />
            <span class="sr-only"> No change </span>
            {/* <span class="text-gray-500">{0}</span> */}
          </>
        }
      >
        <Match when={type() == "increase"}>
          <ArrowUpIcon class="self-center flex-shrink-0 h-4 w-4 text-green-500" />
          <span class="sr-only"> Increased by </span>
          <span class="text-green-600">{change()}</span>
        </Match>
        <Match when={type() == "decrease"}>
          <ArrowDownIcon class="self-center flex-shrink-0 h-4 w-4 text-red-500" />
          <span class="sr-only"> Decreased by </span>
          <span class="text-red-600">{Math.abs(change())}</span>
        </Match>
      </Switch>
    </p>
  );
};
