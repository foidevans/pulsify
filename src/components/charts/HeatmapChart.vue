<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <span class="chart-subtitle">Stream intensity by hour</span>
    </div>
    <div class="chart-body">
      <div ref="chartEl" class="echart-el" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef } from 'vue'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { baseTooltip } from './chartTheme'

interface Props {
  title?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Stream Activity Heatmap',
  height: 240,
})

const chartEl = ref<HTMLDivElement | null>(null)
const chart   = shallowRef<ECharts | null>(null)

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00`
)

function generateHeatData(): number[][] {
  return DAYS.map((_, dayIdx) =>
    HOURS.map((_, hour) => {
      let base = 20
      // Morning commute
      if (hour >= 7 && hour <= 9) base += 40
      // Lunch
      if (hour >= 12 && hour <= 13) base += 25
      // Evening peak
      if (hour >= 18 && hour <= 23) base += 60
      // Weekend boost
      if (dayIdx >= 5) base += 20
      // Late night dip
      if (hour >= 1 && hour <= 6) base = 5
      return Math.floor(base + Math.random() * 20)
    })
  )
}

const heatData = ref<number[][]>(generateHeatData())

let updateInterval: ReturnType<typeof setInterval> | null = null

const seriesData = computed(() =>
  heatData.value.flatMap((dayData, dayIdx) =>
    dayData.map((value, hourIdx) => [hourIdx, dayIdx, value])
  )
)

const maxVal = computed(() =>
  Math.max(...heatData.value.flat())
)

const option = computed(() => ({
  animation: false,
  backgroundColor: 'transparent',
  tooltip: {
    ...baseTooltip,
    trigger: 'item',
    formatter: (p: any) => {
      const day  = DAYS[p.value[1]]
      const hour = HOURS[p.value[0]]
      const val  = p.value[2]
      return `
        <div style="font-size:11px;color:#b3b3b3;margin-bottom:4px">${day} · ${hour}</div>
        <div style="font-size:13px;font-weight:600;color:#fff">${val}K streams</div>
      `
    },
  },
  grid: {
    top: '4%',
    bottom: '14%',
    left: '8%',
    right: '4%',
  },
  xAxis: {
    type: 'category' as const,
    data: HOURS,
    splitArea: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#535353',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: 9,
      interval: 3,
      formatter: (val: string) => val.slice(0, 2),
    },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'category' as const,
    data: DAYS,
    splitArea: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#b3b3b3',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: 11,
    },
    splitLine: { show: false },
  },
  visualMap: {
    min: 0,
    max: maxVal.value,
    show: false,
    inRange: {
      color: [
        '#0a1a0f',
        '#0d2818',
        '#0f3d1f',
        '#115226',
        '#13662e',
        '#167a37',
        '#1DB954',
        '#1ED760',
      ],
    },
  },
  series: [
    {
      type: 'heatmap',
      data: seriesData.value,
      itemStyle: {
        borderWidth: 2,
        borderColor: '#191414',
        borderRadius: 3,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 8,
          shadowColor: 'rgba(29, 185, 84, 0.5)',
        },
      },
    },
  ],
}))

function updateData() {
  heatData.value = generateHeatData()
  chart.value?.setOption({
    series: [{ data: seriesData.value }],
    visualMap: { max: maxVal.value },
  })
}

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

  // Update every 5s for live feel
  updateInterval = setInterval(updateData, 5000)
})

onUnmounted(() => {
  resizeObserver.disconnect()
  chart.value?.dispose()
  chart.value = null
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
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
  justify-content: space-between;
}

.chart-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chart-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: #535353;
}

.chart-body {
  position: relative;
}

.echart-el {
  width: 100%;
}
</style>