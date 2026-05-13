import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStreamStore } from '../stores/streamStore'
import { useUIStore } from '../stores/uiStore'
import type { TimeRange } from '../types'

const TIME_RANGE_MS: Record<TimeRange, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  live: Infinity,
}

export function useChartData() {
  const streamStore = useStreamStore()
  const uiStore = useUIStore()
  const { metricsHistory, artistSeries, artists, genres, regions, topTracks } = storeToRefs(streamStore)
  const { timeRange, selectedArtistIds } = storeToRefs(uiStore)

  const windowMs = computed(() => TIME_RANGE_MS[timeRange.value])

  const windowedMetrics = computed(() => {
    const now = Date.now()
    const cutoff = windowMs.value === Infinity ? 0 : now - windowMs.value
    return metricsHistory.value.filter((p) => p.timestamp >= cutoff)
  })

  const windowedArtistSeries = computed(() => {
    const now = Date.now()
    const cutoff = windowMs.value === Infinity ? 0 : now - windowMs.value
    const filtered = artistSeries.value.filter((p) => p.timestamp >= cutoff)

    return filtered.slice(-60)
  })

  const activeArtists = computed(() => {
    if (selectedArtistIds.value.length === 0) return artists.value
    return artists.value.filter((a) => selectedArtistIds.value.includes(a.id))
  })

  const sortedGenres = computed(() =>
    [...genres.value].sort((a, b) => b.streams - a.streams)
  )

  const primaryArtistRadar = computed(() => {
    const a = streamStore.primaryArtist
    if (!a) return []
    return [
      { axis: 'Popularity', value: a.popularity },
      { axis: 'Reach', value: a.reach },
      { axis: 'Engagement', value: a.engagement },
      { axis: 'Growth', value: a.growth },
      { axis: 'Vitality', value: a.vitality },
    ]
  })

  const cumulativeWeekly = computed(() => {
    const base = streamStore.currentMetrics.totalStreams
    return Array.from({ length: 7 }, (_, i) => ({
      label: `Week ${i + 1}`,
      value: Math.floor(base * (0.1 + (i / 6) * 0.9) * (0.85 + Math.random() * 0.15)),
    }))
  })

  return {
    windowedMetrics,
    windowedArtistSeries,
    activeArtists,
    sortedGenres,
    primaryArtistRadar,
    cumulativeWeekly,
    topTracks,
    regions,
  }
}