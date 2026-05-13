<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
    </div>

    <div v-if="isEmpty" class="chart-empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-8"/>
      </svg>
      <span>Waiting for data...</span>
    </div>
    <div v-else ref="chartEl" class="echart-el" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { baseTooltip, baseGrid, areaGradient } from './chartTheme'
import { formatNumber } from '../../utils/helpers'

interface WeeklyPoint {
  label: string
  value: number
}

interface Props {
  title?: string
  data: WeeklyPoint[]
  color?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Cumulative Streams',
  color: '#1DB954',
  height: 220,
})

const chartEl = ref<HTMLDivElement | null>(null)
const chart   = shallowRef<ECharts | null>(null)

const isEmpty = computed(() => props.data.length === 0)

const option = computed(() => ({
  animation: true,
  animationDuration: 600,
  animationEasing: 'cubicOut' as const,
  backgroundColor: 'transparent',
  tooltip: {
    ...baseTooltip,
    trigger: 'axis',
    formatter: (params: any[]) => {
      const p = params[0]
      return `
        <div style="color:#b3b3b3;font-size:11px">${p.name}</div>
        <div style="font-size:15px;font-weight:600;color:#fff;margin-top:3px">
          ${formatNumber(p.value)} streams
        </div>
      `
    },
  },
  grid: baseGrid({ top: '8%', bottom: '14%', left: '1%', right: '2%' }),
  xAxis: {
    type: 'category' as const,
    data: props.data.map((d) => d.label),
    axisLine: { lineStyle: { color: '#2a2a2a' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#535353',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: 11,
    },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value' as const,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#535353',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: 11,
      formatter: (v: number) => formatNumber(v),
    },
    splitLine: {
      lineStyle: { color: '#252525', type: 'dashed' as const },
    },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: props.data.map((d) => d.value),
      lineStyle: { color: props.color, width: 2.5 },
      areaStyle: { color: areaGradient(props.color, 0.5) },
      emphasis: { disabled: true },
    },
  ],
}))

watch(
  () => props.data,
  () => {
    if (!chart.value) return
    chart.value.setOption({
      xAxis: { data: props.data.map((d) => d.label) },
      series: [{ data: props.data.map((d) => d.value) }],
    })
  },
  { flush: 'post' },
)

const resizeObserver = new ResizeObserver(() => chart.value?.resize())

onMounted(() => {
  if (!chartEl.value) return
  chartEl.value.style.height = `${props.height}px`
  chart.value = echarts.init(chartEl.value, null, {
    renderer: 'canvas',
    useDirtyRect: true,
  })
  chart.value.setOption(option.value)
  resizeObserver.observe(chartEl.value)
})

onUnmounted(() => {
  resizeObserver.disconnect()
  chart.value?.dispose()
  chart.value = null
})
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
}

.chart-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #535353;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
}

.echart-el {
  width: 100%;
  flex: 1;
}
</style>