import { defineStore } from 'pinia'
import { shallowRef, ref, computed } from 'vue'
import type {
  MetricSnapshot,
  StreamEvent,
  Track,
  Artist,
  GenreStat,
  RegionStat,
  ArtistTimeSeriesPoint,
  TimeSeriesPoint,
} from '../types'
import { CircularBufferImpl, validatePayload } from '../utils/helpers'
import type { StreamPayload } from '../types'

// ── Buffer sizes ───────────────────────────────────────────────────────────
const METRICS_BUFFER_SIZE = 300
const EVENTS_BUFFER_SIZE  = 100
const ARTIST_SERIES_SIZE  = 120

// ── Candle type ────────────────────────────────────────────────────────────
export interface CandlePoint {
  timestamp: number
  open:      number
  close:     number
  low:       number
  high:      number
  volume:    number
}

export const useStreamStore = defineStore('stream', () => {

  // ─── Seed / static data ──────────────────────────────────────────────────
  const tracks  = shallowRef<Track[]>([])
  const artists = shallowRef<Artist[]>([])
  const genres  = shallowRef<GenreStat[]>([])
  const regions = shallowRef<RegionStat[]>([])

  // ─── Real-time buffers ───────────────────────────────────────────────────
  const metricsHistory = shallowRef<TimeSeriesPoint[]>([])
  const activityFeed   = shallowRef<StreamEvent[]>([])
  const artistSeries   = shallowRef<ArtistTimeSeriesPoint[]>([])
  const candleData     = shallowRef<CandlePoint[]>([])

  // Internal circular buffers
  const _metricsBuffer      = new CircularBufferImpl<TimeSeriesPoint>(METRICS_BUFFER_SIZE)
  const _eventsBuffer       = new CircularBufferImpl<StreamEvent>(EVENTS_BUFFER_SIZE)
  const _artistSeriesBuffer = new CircularBufferImpl<ArtistTimeSeriesPoint>(ARTIST_SERIES_SIZE)

  // ─── Current snapshot ────────────────────────────────────────────────────
  const currentMetrics = ref<MetricSnapshot>({
    totalStreams:           0,
    activeListeners:        0,
    peakStreamsPerMin:      0,
    engagementRate:         0,
    totalStreamsDelta:      0,
    activeListenersDelta:   0,
    peakStreamsPerMinDelta: 0,
    engagementRateDelta:    0,
    capturedAt:             0,
  })

  // ─── Track stream counts ─────────────────────────────────────────────────
  const trackStreamCounts = ref<Record<string, number>>({})

  // ─── Sequence tracking ───────────────────────────────────────────────────
  const lastSequenceId  = ref(0)
  const droppedPayloads = ref(0)

  // ─── Actions ─────────────────────────────────────────────────────────────

  function setSeedData(data: {
    tracks:          Track[]
    artists:         Artist[]
    genres:          GenreStat[]
    regions:         RegionStat[]
    totalStreams:     number
    activeListeners: number
  }) {
    tracks.value  = data.tracks
    artists.value = data.artists
    genres.value  = data.genres
    regions.value = data.regions

    currentMetrics.value = {
      totalStreams:           data.totalStreams,
      activeListeners:        data.activeListeners,
      peakStreamsPerMin:      Math.floor(data.activeListeners / 15),
      engagementRate:         91.2,
      totalStreamsDelta:      12.5,
      activeListenersDelta:   6.3,
      peakStreamsPerMinDelta: 5.1,
      engagementRateDelta:    3.2,
      capturedAt:             Date.now(),
    }

    const counts: Record<string, number> = {}
    data.tracks.forEach((t) => { counts[t.id] = t.streams })
    trackStreamCounts.value = counts
  }

  function processPayload(raw: unknown): void {
    if (!validatePayload(raw)) {
      droppedPayloads.value++
      return
    }

    const payload = raw as StreamPayload

    // Detect sequence gaps
    if (payload.sequenceId !== lastSequenceId.value + 1 && lastSequenceId.value !== 0) {
      console.warn(
        `[StreamStore] Gap detected: expected ${lastSequenceId.value + 1}, got ${payload.sequenceId}`,
      )
    }
    lastSequenceId.value = payload.sequenceId

    switch (payload.type) {
      case 'metrics':
        _handleMetrics(payload.data as MetricSnapshot)
        break
      case 'event':
        _handleEvent(payload.data as StreamEvent)
        break
      case 'track_update':
        _handleTrackUpdate(
          payload.data as { trackId: string; streams: number; trend: number; rank: number },
        )
        break
      case 'artist_update':
        _handleArtistUpdate(payload.data as ArtistTimeSeriesPoint)
        break
      case 'candle_update':
        _handleCandleUpdate(payload.data as CandlePoint[])
        break
    }
  }

  function _handleMetrics(data: MetricSnapshot): void {
    currentMetrics.value = data
    _metricsBuffer.push({ timestamp: data.capturedAt, value: data.totalStreams })
    metricsHistory.value = _metricsBuffer.toArray()
  }

  function _handleEvent(data: StreamEvent): void {
    _eventsBuffer.push(data)
    activityFeed.value = _eventsBuffer.toArray().reverse()
  }

  function _handleTrackUpdate(data: {
    trackId: string
    streams: number
    trend:   number
    rank:    number
  }): void {
    trackStreamCounts.value = {
      ...trackStreamCounts.value,
      [data.trackId]: data.streams,
    }

    const idx = tracks.value.findIndex((t) => t.id === data.trackId)
    if (idx !== -1) {
      const updated = [...tracks.value]
      updated[idx]  = { ...updated[idx], streams: data.streams, trend: data.trend }
      tracks.value  = updated
    }
  }

  function _handleArtistUpdate(data: ArtistTimeSeriesPoint): void {
    _artistSeriesBuffer.push(data)
    artistSeries.value = _artistSeriesBuffer.toArray()
  }

  function _handleCandleUpdate(data: CandlePoint[]): void {

    candleData.value = data
  }

  function clearAll(): void {
    _metricsBuffer.clear()
    _eventsBuffer.clear()
    _artistSeriesBuffer.clear()
    metricsHistory.value  = []
    activityFeed.value    = []
    artistSeries.value    = []
    candleData.value      = []
    droppedPayloads.value = 0
    lastSequenceId.value  = 0
  }

  // ─── Computed selectors ──────────────────────────────────────────────────

  const topTracks = computed(() =>
    [...tracks.value].sort((a, b) => b.streams - a.streams).slice(0, 8),
  )

  const primaryArtist = computed(() => artists.value[0] ?? null)

  return {
    // State
    tracks,
    artists,
    genres,
    regions,
    metricsHistory,
    activityFeed,
    artistSeries,
    candleData,
    currentMetrics,
    trackStreamCounts,
    droppedPayloads,

    // Computed
    topTracks,
    primaryArtist,

    // Actions
    setSeedData,
    processPayload,
    clearAll,
  }
})