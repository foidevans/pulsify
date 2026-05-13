<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <div class="legend">
        <button
          v-for="(artist, i) in artists"
          :key="artist.id"
          class="legend-item"
          :class="{ dimmed: !isActive(artist.id) }"
          @click="emit('toggle-artist', artist.id)"
        >
          <span
            class="legend-dot"
            :style="{ background: ARTIST_LINE_COLORS[i % ARTIST_LINE_COLORS.length] }"
          />
          <span class="legend-label">{{ shortName(artist.name) }}</span>
        </button>
      </div>
    </div>

    <div class="chart-body">
      <div v-show="isEmpty" class="chart-empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-8"/>
        </svg>
        <span>Waiting for stream data...</span>
      </div>
      <div ref="chartEl" class="echart-el" :style="{ opacity: isEmpty ? 0 : 1 }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import * as echarts from 'echarts/core'
import type { ECharts } from 'echarts/core'
import {
  baseTooltip,
  baseGrid,
  baseTimeXAxis,
  baseYAxis,
  ARTIST_LINE_COLORS,
} from './chartTheme'
import { formatNumber } from '../../utils/helpers'
import type { Artist, ArtistTimeSeriesPoint } from '../../types/index'

interface Props {
  title?: string
  artists: Artist[]
  series: ArtistTimeSeriesPoint[]
  activeArtistIds?: string[]
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Streams by Artist',
  activeArtistIds: () => [],
  height: 220,
})

const emit = defineEmits<{ (e: 'toggle-artist', id: string): void }>()

const chartEl = ref<HTMLDivElement | null>(null)
const chart   = shallowRef<ECharts | null>(null)

const isEmpty = computed(() => props.series.length === 0)

function isActive(id: string): boolean {
  return props.activeArtistIds.length === 0 || props.activeArtistIds.includes(id)
}

function shortName(name: string): string {
  return name.split(' ft.')[0].split(',')[0].slice(0, 14)
}

const seriesData = computed(() =>
  props.artists.map((artist, i) => {
    const color = ARTIST_LINE_COLORS[i % ARTIST_LINE_COLORS.length]
    return {
      name: shortName(artist.name),
      type: 'line' as const,
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color,
        width: isActive(artist.id) ? 2 : 0.5,
        opacity: isActive(artist.id) ? 1 : 0.2,
      },
      areaStyle: isActive(artist.id)
        ? {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: color + '28' },
                { offset: 1, color: color + '00' },
              ],
            },
          }
        : undefined,
      data: props.series.map((pt) => [
        pt.timestamp,
        (pt[artist.id] as number) ?? 0,
      ]),
      emphasis: { disabled: true },
    }
  })
)

const option = computed(() => ({
  animation: false,
  backgroundColor: 'transparent',
  tooltip: {
    ...baseTooltip,
    trigger: 'axis',
    formatter: (params: any[]) => {
      const header = `
        <div style="color:#b3b3b3;font-size:11px;margin-bottom:6px">
          ${new Date(params[0]?.value?.[0]).toLocaleTimeString('en-US', { hour12: false })}
        </div>
      `
      const rows = params
        .filter((p) => p.value?.[1] > 0)
        .sort((a, b) => b.value[1] - a.value[1])
        .slice(0, 5)
        .map(
          (p) => `
            <div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0">
              <span style="color:${p.color}">${p.seriesName}</span>
              <span style="font-weight:600;color:#fff">${formatNumber(p.value[1])}</span>
            </div>
          `,
        )
        .join('')
      return header + rows
    },
  },
  grid: baseGrid({ top: '5%', bottom: '14%', left: '1%', right: '1%' }),
  xAxis: {
    ...baseTimeXAxis,
    axisLabel: {
      ...baseTimeXAxis.axisLabel,
      formatter: (v: number) =>
        new Date(v).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
    },
  },
  yAxis: baseYAxis({ formatter: (v: number) => formatNumber(v) }),
  series: seriesData.value,
}))

watch(
  () => props.series,
  () => {
    if (!chart.value) return
    chart.value.setOption(
      { series: seriesData.value },
      { replaceMerge: ['series'] },
    )
  },
  { flush: 'post' },
)

watch(
  () => props.activeArtistIds,
  () => {
    if (!chart.value) return
    chart.value.setOption(
      { series: seriesData.value },
      { replaceMerge: ['series'] },
    )
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
  gap: 0.75rem;
  height: 100%;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 0;
  transition: opacity 0.2s;
}

.legend-item.dimmed { opacity: 0.35; }

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  color: #b3b3b3;
  white-space: nowrap;
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
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 1;
}

.echart-el {
  width: 100%;
  transition: opacity 0.3s;
}
</style>