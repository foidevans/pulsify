<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
    </div>
    <div class="pie-body">
      <div ref="chartEl" class="echart-el" />
      <div class="pie-legend">
        <div
          v-for="(item, i) in data"
          :key="item.region"
          class="legend-row"
        >
          <span
            class="legend-dot"
            :style="{ background: REGION_COLORS[i % REGION_COLORS.length] }"
          />
          <span class="legend-region">{{ item.region }}</span>
          <span class="legend-pct">{{ item.percentage }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { baseTooltip, REGION_COLORS } from './chartTheme'
import { formatNumber } from '../../utils/helpers'
import type { RegionStat } from '../../types/index'

interface Props {
  title?: string
  data: RegionStat[]
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Regional Distribution',
  height: 200,
})

const chartEl = ref<HTMLDivElement | null>(null)
const chart = shallowRef<ECharts | null>(null)

const option = computed(() => ({
  animation: true,
  animationDuration: 600,
  backgroundColor: 'transparent',
  tooltip: {
    ...baseTooltip,
    trigger: 'item',
    formatter: (p: any) =>
      `<span style="color:${p.color}">●</span>
       <strong style="color:#fff">${p.name}</strong><br/>
       <span style="color:#b3b3b3">
         ${p.value}% · ${formatNumber(p.data.streams)} streams
       </span>`,
  },
  series: [
    {
      type: 'pie',
      radius: ['42%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 6,
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0,0,0,0.5)',
        },
      },
      data: props.data.map((r, i) => ({
        name: r.region,
        value: r.percentage,
        streams: r.streams,
        itemStyle: {
          color: REGION_COLORS[i % REGION_COLORS.length],
          borderColor: '#191414',
          borderWidth: 2,
        },
      })),
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
  gap: 0.75rem;
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

.pie-body {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.echart-el {
  flex: 0 0 160px;
  height: 160px;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-region {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: var(--text-secondary, #b3b3b3);
  flex: 1;
}

.legend-pct {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: var(--text-primary, #ffffff);
  font-weight: 500;
}
</style>