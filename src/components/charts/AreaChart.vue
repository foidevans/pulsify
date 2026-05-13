<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <span v-if="isLive" class="chart-live-dot" />
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
        <span>Waiting for data...</span>
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
import {
  baseTooltip,
  baseGrid,
  baseTimeXAxis,
  baseYAxis,
  areaGradient,
} from "./chartTheme";
import { formatNumber, formatTime } from "../../utils/helpers";
import type { TimeSeriesPoint } from "../../types/index";

interface Props {
  title?: string;
  data: TimeSeriesPoint[];
  color?: string;
  isLive?: boolean;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Live Stream Volume",
  color: "#1DB954",
  isLive: false,
  height: 220,
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
      const p = params[0];
      return `
        <div style="font-family:'DM Sans';font-size:11px;color:#b3b3b3">
          ${formatTime(p.value[0])}
        </div>
        <div style="font-size:14px;font-weight:600;color:#fff;margin-top:2px">
          ${formatNumber(p.value[1])} streams
        </div>
      `;
    },
  },
  grid: baseGrid({ top: "8%", bottom: "14%", left: "1%", right: "1%" }),
  xAxis: {
    ...baseTimeXAxis,
    axisLabel: {
      ...baseTimeXAxis.axisLabel,
      formatter: (val: number) =>
        new Date(val).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
    },
  },
  yAxis: {
    ...baseYAxis({ formatter: (v: number) => formatNumber(v) }),
    splitLine: {
      lineStyle: { color: "#252525", type: "dashed" as const },
    },
  },
  series: [
    {
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { color: props.color, width: 2.5 },
      areaStyle: { color: areaGradient(props.color, 0.4) },
      data: props.data.map((p) => [p.timestamp, p.value]),
      emphasis: { disabled: true },
    },
  ],
}));

watch(
  () => props.data,
  (newData) => {
    if (!chart.value) return;
    chart.value.setOption(
      { series: [{ data: newData.map((p) => [p.timestamp, p.value]) }] },
      { replaceMerge: ["series"] },
    );
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
  gap: 8px;
}

.chart-title {
  font-family: "DM Sans", sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chart-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1db954;
  box-shadow: 0 0 6px #1db954;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

.chart-body {
  position: relative;
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
