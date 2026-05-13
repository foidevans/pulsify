<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
    </div>
    <div ref="chartEl" class="echart-el" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { baseTooltip, SPOTIFY_COLORS } from './chartTheme'

interface RadarPoint {
  axis: string
  value: number
}

interface Props {
  title?: string
  data: RadarPoint[]
  color?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Artist Profile',
  color: '#1DB954',
  height: 220,
})

const chartEl = ref<HTMLDivElement | null>(null)
const chart = shallowRef<ECharts | null>(null)

const option = computed(() => ({
  animation: true,
  animationDuration: 800,
  backgroundColor: 'transparent',
  tooltip: {
    ...baseTooltip,
    trigger: 'item',
    formatter: (p: any) => {
      const items = props.data
        .map((d, i) => `<div style="display:flex;justify-content:space-between;gap:12px">
          <span style="color:#b3b3b3">${d.axis}</span>
          <span style="font-weight:600;color:#fff">${p.value[i]}</span>
        </div>`)
        .join('')
      return items
    },
  },
  radar: {
    indicator: props.data.map((d) => ({
      name: d.axis,
      max: 100,
    })),
    center: ['50%', '52%'],
    radius: '68%',
    axisName: {
      color: '#b3b3b3',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: 11,
      fontWeight: '500',
    },
    axisLine: { lineStyle: { color: '#2a2a2a' } },
    splitLine: { lineStyle: { color: '#2a2a2a', type: 'dashed' } },
    splitArea: {
      areaStyle: {
        color: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.02)'],
      },
    },
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: props.data.map((d) => d.value),
          areaStyle: {
            color: {
              type: 'radial',
              x: 0.5, y: 0.5, r: 0.5,
              colorStops: [
                { offset: 0, color: props.color + '55' },
                { offset: 1, color: props.color + '18' },
              ],
            },
          },
          lineStyle: { color: props.color, width: 2 },
          itemStyle: { color: props.color },
          symbol: 'circle',
          symbolSize: 4,
        },
      ],
    },
  ],
}))

watch(
  () => props.data,
  () => { chart.value?.setOption(option.value) },
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
.chart-header {
  display: flex;
  align-items: center;
}
.chart-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.echart-el {
  width: 100%;
  flex: 1;
}
</style>