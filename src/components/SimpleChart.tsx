// @ts-nocheck
import { Component, onMount, JSX, splitProps, onCleanup } from "solid-js";
import {
  BarController,
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  Filler,
  PointElement,
} from "chart.js";
import { isServer } from "solid-js/web";
if (!isServer)
  Chart.register(LinearScale, PointElement, CategoryScale, Filler, LineElement, LineController, BarController);

const corsair = {
  id: "corsair",
  afterInit: (chart) => {
    if (!chart) return;
    chart.corsair = {
      x: 0,
      y: 0,
    };
  },
  afterEvent: (chart, evt) => {
    if (!chart) return;
    const {
      chartArea: { top, bottom, left, right },
    } = chart;
    const { x, y } = evt.event;
    if (x < left || x > right || y < top || y > bottom) {
      chart.corsair = {
        x,
        y,
        draw: false,
      };
      chart.draw();
      return;
    }

    chart.corsair = {
      x,
      y,
      draw: true,
    };

    chart.draw();
  },
  afterDatasetsDraw: (chart, _, opts) => {
    const {
      ctx,
      chartArea: { top, bottom, left, right },
    } = chart;

    if (!chart.corsair || !chart.corsair.draw) {
      return;
    }

    const { x, y, draw } = chart.corsair;

    ctx.lineWidth = opts.width || 0;
    ctx.setLineDash(opts.dash || []);
    ctx.strokeStyle = opts.color || "white";

    ctx.save();
    ctx.beginPath();
    if (opts.vertical) {
      ctx.moveTo(x, bottom);
      ctx.lineTo(x, top);
    }
    if (opts.horizontal) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();
    ctx.restore();
  },
};

export const SimpleChart: Component<
  JSX.CanvasHTMLAttributes<HTMLCanvasElement> & {
    data: number[];
    onHover: (value: number, index: number) => any;
    lineColor: string;
    areaColor: string;
  }
> = (props) => {
  const [local, others] = splitProps(props, ["data", "onHover", "lineColor", "areaColor"]);
  let canvas!: HTMLCanvasElement;
  let chart: Chart;

  onMount(() => {
    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: local.data,
        datasets: [
          {
            data: local.data,
            backgroundColor: local.areaColor,
            borderColor: local.lineColor,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointStyle: "circle",
            animation: false,
            fill: "start",
            cubicInterpolationMode: "monotone",
            tension: 0.8,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        onHover: function (event, chartElement) {
          if (chartElement && chartElement.length) {
            props.onHover(local.data[chartElement[0].index], chartElement[0].index);
          }
        },
        hover: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          filler: {
            propagate: false,
          },
          corsair: {
            horizontal: false,
            vertical: true,
            color: local.lineColor,
            dash: [],
            width: 3,
          },
        } as Chart["options"]["plugins"],
        scales: {
          y: {
            display: false,
            offset: true,
          },
          x: {
            display: false,
          },
        },
      },
      plugins: [corsair],
    });
  });

  onCleanup(() => chart?.destroy());

  return <canvas ref={canvas} style="height: 80px; width: 100%" />;
};
