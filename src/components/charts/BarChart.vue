<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
    </div>
    <div class="chart-body" :style="{ height: `${height}px` }">
      <div ref="chartEl" class="echart-el" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from "vue";
import * as echarts from "echarts/core";
import type { ECharts } from "echarts/core";
import { baseTooltip, GENRE_COLORS } from "./chartTheme";
import { formatNumber } from "../../utils/helpers";
import type { GenreStat } from "../../types/index";

interface Props {
  title?: string;
  data: GenreStat[];
  height?: number;
  orientation?: "horizontal" | "vertical";
}

const props = withDefaults(defineProps<Props>(), {
  title: "Top Genres",
  height: 220,
  orientation: "horizontal",
});

const chartEl = ref<HTMLDivElement | null>(null);
const chart = shallowRef<ECharts | null>(null);

const sorted = computed(() =>
  [...props.data].sort((a, b) => b.streams - a.streams).slice(0, 5),
);

const option = computed(() => {
  const isH = props.orientation === "horizontal";
  const labels = sorted.value.map((g) => g.genre);
  const values = sorted.value.map((g, i) => ({
    value: g.streams,
    itemStyle: {
      color: GENRE_COLORS[i % GENRE_COLORS.length],
      borderRadius: isH ? [0, 4, 4, 0] : [4, 4, 0, 0],
    },
  }));

  return {
    animation: true,
    animationDuration: 400,
    animationEasing: "cubicOut" as const,
    backgroundColor: "transparent",
    tooltip: {
      ...baseTooltip,
      trigger: "axis",
      axisPointer: { type: "none" },
      formatter: (params: any[]) => {
        const p = params[0];
        return `
          <span style="color:${p.color}">■</span>
          <strong style="color:#fff">${p.name}</strong><br/>
          <span style="color:#b3b3b3">${formatNumber(p.value)} streams</span>
        `;
      },
    },
    grid: {
      top: "4%",
      bottom: isH ? "4%" : "14%",
      left: isH ? "2%" : "3%",
      right: "8%",
      containLabel: true,
    },
    xAxis: isH
      ? {
          type: "value" as const,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: "#535353",
            fontSize: 10,
            fontFamily: '"DM Sans", sans-serif',
            formatter: (v: number) => formatNumber(v),
          },
          splitLine: {
            lineStyle: { color: "#252525", type: "dashed" as const },
          },
        }
      : {
          type: "category" as const,
          data: labels,
          axisLine: { lineStyle: { color: "#2a2a2a" } },
          axisTick: { show: false },
          axisLabel: {
            color: "#535353",
            fontSize: 10,
            fontFamily: '"DM Sans", sans-serif',
          },
          splitLine: { show: false },
        },
    yAxis: isH
      ? {
          type: "category" as const,
          data: [...labels].reverse(),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: "#b3b3b3",
            fontSize: 12,
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: "500",
          },
          splitLine: { show: false },
        }
      : {
          type: "value" as const,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: "#535353",
            fontSize: 10,
            fontFamily: '"DM Sans", sans-serif',
            formatter: (v: number) => formatNumber(v),
          },
          splitLine: {
            lineStyle: { color: "#252525", type: "dashed" as const },
          },
        },
    series: [
      {
        type: "bar" as const,
        data: isH ? [...values].reverse() : values,
        barMaxWidth: isH ? 18 : 40,
        label: {
          show: true,
          position: isH ? ("right" as const) : ("top" as const),
          color: "#b3b3b3",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          formatter: (p: any) => formatNumber(p.value),
        },
        emphasis: {
          itemStyle: { opacity: 0.85 },
        },
      },
    ],
  };
});

watch(
  () => [props.data, props.orientation],
  () => {
    if (!chart.value) return;
    chart.value.setOption(option.value, true);
  },
  { flush: "post", deep: true },
);
const resizeObserver = new ResizeObserver(() => chart.value?.resize());

onMounted(() => {
  if (!chartEl.value) return;
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

.chart-title {
  font-family: "DM Sans", sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chart-body {
  position: relative;
}

.echart-el {
  width: 100%;
  height: 100%;
}
</style>
