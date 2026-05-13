// ─── Core Domain Types ───────────────────────────────────────────────────────

export interface Track {
  id: string
  name: string
  artist: string
  artistId: string
  streams: number
  trend: number // % change
  rank: number
  genre: string
  duration: number // seconds
  imageUrl?: string
}

export interface Artist {
  id: string
  name: string
  streams: number
  listeners: number
  genre: string
  popularity: number // 0-100
  reach: number // 0-100
  engagement: number // 0-100
  growth: number // 0-100
  vitality: number // 0-100
  color: string // chart color assigned
}

export interface GenreStat {
  genre: string
  streams: number
  color: string
}

export interface RegionStat {
  region: string
  percentage: number
  streams: number
  color: string
}

// ─── Streaming / Real-time Types ─────────────────────────────────────────────

export interface StreamEvent {
  id: string
  timestamp: number
  userId: string
  userName: string
  userAvatar: string
  trackId: string
  trackName: string
  artistName: string
  city: string
  country: string
  region: string
  streamCount: number
  eventType: 'stream' | 'skip' | 'like' | 'share' | 'playlist_add'
  severity?: 'info' | 'success' | 'warning'
}

export interface TimeSeriesPoint {
  timestamp: number
  value: number
}

export interface ArtistTimeSeriesPoint {
  timestamp: number
  [artistId: string]: number
}

export interface MetricSnapshot {
  totalStreams: number
  activeListeners: number
  peakStreamsPerMin: number
  engagementRate: number
  totalStreamsDelta: number
  activeListenersDelta: number
  peakStreamsPerMinDelta: number
  engagementRateDelta: number
  capturedAt: number
}

// ─── WebSocket / Stream Types ─────────────────────────────────────────────────

export type StreamStatus = 'connecting' | 'live' | 'paused' | 'error' | 'reconnecting'

export interface StreamPayload {
  type: 'metrics' | 'event' | 'track_update' | 'artist_update' | 'genre_update' | 'candle_update'
  data: unknown
  timestamp: number
  sequenceId: number
}

export interface StreamPayloadMetrics extends StreamPayload {
  type: 'metrics'
  data: MetricSnapshot
}

export interface StreamPayloadEvent extends StreamPayload {
  type: 'event'
  data: StreamEvent
}

export interface StreamPayloadTrackUpdate extends StreamPayload {
  type: 'track_update'
  data: { trackId: string; streams: number; trend: number; rank: number }
}

// ─── Last.fm API Types ────────────────────────────────────────────────────────

export interface LastFmTrack {
  name: string
  artist: { name: string; mbid?: string }
  playcount: string
  listeners: string
  mbid?: string
  url: string
  image?: Array<{ '#text': string; size: string }>
}

export interface LastFmTopTracksResponse {
  tracks: {
    track: LastFmTrack[]
    '@attr': {
      page: string
      perPage: string
      totalPages: string
      total: string
    }
  }
}

// ─── UI / Store Types ─────────────────────────────────────────────────────────

export type TimeRange = '1m' | '5m' | '15m' | '1h' | 'live'

export interface UIState {
  timeRange: TimeRange
  isPaused: boolean
  theme: 'dark' | 'light'
  selectedArtistIds: string[]
  streamStatus: StreamStatus
  isLoading: boolean
  error: string | null
}

export interface CircularBuffer<T> {
  push(item: T): void
  toArray(): T[]
  get length(): number
  clear(): void
}