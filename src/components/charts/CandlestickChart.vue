<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <span class="chart-subtitle">OHLC · 1m candles</span>
    </div>

    <div class="chart-body">
      <div v-show="isEmpty" class="chart-empty">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        >
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 4-8" />
        </svg>
        <span>Waiting for candle data... (updates every 3s)</span>
      </div>
      <div
        ref="chartEl"
        class="echart-el"
        :style="{ opacity: isEmpty ? 0 : 1 }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from "vue";
import * as echarts from "echarts/core";
import type { ECharts } from "echarts/core";
import { baseTooltip } from "./chartTheme";
import { formatNumber } from "../../utils/helpers";
import type { CandlePoint } from "../../stores/streamStore";

interface Props {
  title?: string;
  data: CandlePoint[];
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Pulsify Index — Price Action",
  height: 300,
});

const chartEl = ref<HTMLDivElement | null>(null);
const chart = shallowRef<ECharts | null>(null);

const isEmpty = computed(() => props.data.length === 0);

const option = computed(() => ({
  animation: false,
  backgroundColor: "transparent",
  tooltip: {
    ...baseTooltip,
    trigger: "axis",
    formatter: (params: any[]) => {
      const c = params.find((p: any) => p.seriesType === "candlestick");
      if (!c) return "";
      const [o, cl, l, h] = c.value.slice(1);
      const color = cl >= o ? "#1DB954" : "#ef4444";
      return `
        <div style="font-size:11px;color:#b3b3b3;margin-bottom:6px">
          ${new Date(c.value[0]).toLocaleTimeString("en-US", { hour12: false })}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:12px">
          <span style="color:#535353">Open</span>
          <span style="color:#fff;font-weight:600">${formatNumber(o)}</span>
          <span style="color:#535353">Close</span>
          <span style="color:${color};font-weight:600">${formatNumber(cl)}</span>
          <span style="color:#535353">High</span>
          <span style="color:#1DB954;font-weight:600">${formatNumber(h)}</span>
          <span style="color:#535353">Low</span>
          <span style="color:#ef4444;font-weight:600">${formatNumber(l)}</span>
        </div>
      `;
    },
  },
  axisPointer: { link: [{ xAxisIndex: "all" }] },
  grid: [
    {
      top: "4%",
      left: "3%",
      right: "3%",
      bottom: "30%",
      containLabel: true,
    },
    {
      top: "74%",
      left: "3%",
      right: "3%",
      bottom: "4%",
      containLabel: true,
    },
  ],
  xAxis: [
    {
      type: "category" as const,
      gridIndex: 0,
      data: props.data.map((d) =>
        new Date(d.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      ),
      axisLine: { lineStyle: { color: "#2a2a2a" } },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    {
      type: "category" as const,
      gridIndex: 1,
      data: props.data.map((d) =>
        new Date(d.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      ),
      axisLine: { lineStyle: { color: "#2a2a2a" } },
      axisTick: { show: false },
      axisLabel: {
        color: "#535353",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 10,
      },
      splitLine: { show: false },
    },
  ],
  yAxis: [
    {
      type: "value" as const,
      gridIndex: 0,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#535353",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 10,
        formatter: (v: number) => formatNumber(v),
      },
      splitLine: {
        lineStyle: { color: "#252525", type: "dashed" as const },
      },
    },
    {
      type: "value" as const,
      gridIndex: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#535353",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 10,
        formatter: (v: number) => formatNumber(v),
      },
      splitLine: {
        lineStyle: { color: "#252525", type: "dashed" as const },
      },
    },
  ],
  series: [
    {
      type: "candlestick" as const,
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: props.data.map((d) => [d.open, d.close, d.low, d.high]),
      itemStyle: {
        color: "#1DB954",
        color0: "#ef4444",
        borderColor: "#1DB954",
        borderColor0: "#ef4444",
      },
    },
    {
      type: "bar" as const,
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: props.data.map((d) => ({
        value: d.volume,
        itemStyle: {
          color:
            d.close >= d.open ? "rgba(29,185,84,0.6)" : "rgba(239,68,68,0.6)",
        },
      })),
      barMaxWidth: 12,
    },
  ],
}));

watch(
  () => props.data,
  () => {
    if (!chart.value || props.data.length === 0) return;
    chart.value.setOption(option.value);
  },
  { flush: "post" },
);

const resizeObserver = new ResizeObserver(() => chart.value?.resize());

onMounted(() => {
  if (!chartEl.value) return;
  chartEl.value.style.height = `${props.height}px`;
  chart.value = echarts.init(chartEl.value, null, {
    renderer: "canvas",
    useDirtyRect: true,
  });
  chart.value.setOption(option.value);
  resizeObserver.observe(chartEl.value);
});

onUnmounted(() => {
  resizeObserver.disconnect();
  chart.value?.dispose();
  chart.value = null;
});
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.chart-title {
  font-family: "DM Sans", sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chart-subtitle {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.65rem;
  color: #535353;
}

.chart-body {
  position: relative;
  flex: 1;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #535353;
  font-family: "DM Sans", sans-serif;
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 1;
}

.echart-el {
  width: 100%;
  transition: opacity 0.3s;
}
</style>
