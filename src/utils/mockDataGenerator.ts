import type {
  StreamPayload,
  StreamEvent,
  MetricSnapshot,
  Track,
  Artist,
} from '../types'
import { jitter, clamp, sanitizeString } from './helpers'
import type { SeedData } from './lastfmService'


const FIRST_NAMES = ['Alex', 'Sarah', 'Mike', 'Aisha', 'Chen', 'Fatima', 'Lucas', 'Priya', 'Omar', 'Nina', 'Kwame', 'Yuki']
const LAST_INITIALS = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.', 'I.', 'J.', 'K.', 'L.']
const CITIES = [
  { city: 'London',      region: 'Europe' },
  { city: 'Paris',       region: 'Europe' },
  { city: 'New York',    region: 'North America' },
  { city: 'Los Angeles', region: 'North America' },
  { city: 'Lagos',       region: 'Africa' },
  { city: 'Tokyo',       region: 'Asia Pacific' },
  { city: 'São Paulo',   region: 'Latin America' },
  { city: 'Berlin',      region: 'Europe' },
  { city: 'Toronto',     region: 'North America' },
  { city: 'Sydney',      region: 'Asia Pacific' },
  { city: 'Dubai',       region: 'Asia Pacific' },
  { city: 'Mumbai',      region: 'Asia Pacific' },
  { city: 'Nairobi',     region: 'Africa' },
  { city: 'Mexico City', region: 'Latin America' },
]
const EVENT_TYPES: Array<StreamEvent['eventType']> = [
  'stream', 'stream', 'stream', 'like', 'share', 'playlist_add', 'skip',
]

let sequenceId = 0

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}


interface CandlePoint {
  timestamp: number
  open:      number
  close:     number
  low:       number
  high:      number
  volume:    number
}


type MessageHandler = (payload: StreamPayload) => void
type StatusHandler  = (status: 'open' | 'close' | 'error') => void

export class MockWebSocket {
  private tracks:   Track[]  = []
  private artists:  Artist[] = []
  private metrics:  MetricSnapshot

  private intervalId:        ReturnType<typeof setInterval> | null = null
  private metricsIntervalId: ReturnType<typeof setInterval> | null = null
  private candleIntervalId:  ReturnType<typeof setInterval> | null = null

  private onMessage: MessageHandler
  private onStatus:  StatusHandler
  private isOpen = false

  private currentStreams:    number
  private currentListeners:  number
  private currentPeakRate:   number
  private currentEngagement: number
  private artistStreamRates: Record<string, number> = {}

  private candleBuffer:    Map<number, Omit<CandlePoint, 'timestamp'>> = new Map()
  private candleBasePrice: number = 150 + Math.random() * 100

  constructor(onMessage: MessageHandler, onStatus: StatusHandler) {
    this.onMessage = onMessage
    this.onStatus  = onStatus
    this.metrics = {
      totalStreams:           0,
      activeListeners:        0,
      peakStreamsPerMin:      0,
      engagementRate:         0,
      totalStreamsDelta:      0,
      activeListenersDelta:   0,
      peakStreamsPerMinDelta: 0,
      engagementRateDelta:    0,
      capturedAt:             Date.now(),
    }
    this.currentStreams    = 0
    this.currentListeners = 0
    this.currentPeakRate  = 0
    this.currentEngagement = 0
  }

  seed(data: SeedData): void {
    this.tracks  = data.tracks
    this.artists = data.artists

    this.currentStreams     = data.totalStreams
    this.currentListeners   = data.activeListeners
    this.currentPeakRate    = Math.floor(data.activeListeners / 15)
    this.currentEngagement  = 88 + Math.random() * 8

    data.artists.forEach((artist) => {
      this.artistStreamRates[artist.id] = Math.floor(artist.streams / 20)
    })

    this.metrics = {
      totalStreams:           this.currentStreams,
      activeListeners:        this.currentListeners,
      peakStreamsPerMin:      this.currentPeakRate,
      engagementRate:         parseFloat(this.currentEngagement.toFixed(1)),
      totalStreamsDelta:      12.5,
      activeListenersDelta:   6.3,
      peakStreamsPerMinDelta: 5.1,
      engagementRateDelta:    3.2,
      capturedAt:             Date.now(),
    }
  }

  connect(): void {
    setTimeout(() => {
      this.isOpen = true
      this.onStatus('open')
      this._startStreaming()
    }, 600)
  }

  disconnect(): void {
    this.isOpen = false
    this._clearIntervals()
    this.onStatus('close')
  }

  pause(): void {
    this._clearIntervals()
  }

  resume(): void {
    if (this.isOpen) {
      this._startStreaming()
    }
  }

  private _clearIntervals(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.metricsIntervalId !== null) {
      clearInterval(this.metricsIntervalId)
      this.metricsIntervalId = null
    }
    if (this.candleIntervalId !== null) {
      clearInterval(this.candleIntervalId)
      this.candleIntervalId = null
    }
  }

  private _startStreaming(): void {
    this._clearIntervals()

    const streamEvent = () => {
      if (!this.isOpen) return
      this._emitStreamEvent()
      this.intervalId = setTimeout(
        streamEvent,
        600 + Math.random() * 600,
      ) as unknown as ReturnType<typeof setInterval>
    }
    this.intervalId = setTimeout(streamEvent, 300) as unknown as ReturnType<typeof setInterval>

    this.metricsIntervalId = setInterval(() => {
      if (!this.isOpen) return
      this._emitMetricsUpdate()
    }, 1500)

    this.candleIntervalId = setInterval(() => {
      if (!this.isOpen) return
      this._emitCandleUpdate()
    }, 3000)
  }


  private _emitStreamEvent(): void {
    if (this.tracks.length === 0) return

    const track      = randomFrom(this.tracks)
    const location   = randomFrom(CITIES)
    const firstName  = randomFrom(FIRST_NAMES)
    const lastInitial = randomFrom(LAST_INITIALS)
    const eventType  = randomFrom(EVENT_TYPES)

    const event: StreamEvent = {
      id:          generateEventId(),
      timestamp:   Date.now(),
      userId:      `user-${Math.random().toString(36).slice(2, 9)}`,
      userName:    sanitizeString(`${firstName} ${lastInitial}`),
      userAvatar:  firstName.charAt(0).toUpperCase(),
      trackId:     track.id,
      trackName:   sanitizeString(track.name),
      artistName:  sanitizeString(track.artist),
      city:        sanitizeString(location.city),
      country:     sanitizeString(location.city),
      region:      location.region,
      streamCount: 1,
      eventType,
      severity: eventType === 'share' ? 'success' : eventType === 'skip' ? 'warning' : 'info',
    }

    const payload: StreamPayload = {
      type:       'event',
      data:       event,
      timestamp:  Date.now(),
      sequenceId: ++sequenceId,
    }

    this.onMessage(payload)
    this._emitTrackUpdate(track)
  }

  // ── Track update ──────────────────────────────────────────────────────────

  private _emitTrackUpdate(track: Track): void {
    const delta = Math.floor(Math.random() * 500 + 50)
    const payload: StreamPayload = {
      type: 'track_update',
      data: {
        trackId: track.id,
        streams: track.streams + delta,
        trend:   track.trend + (Math.random() - 0.45) * 0.3,
        rank:    track.rank,
      },
      timestamp:  Date.now(),
      sequenceId: ++sequenceId,
    }
    this.onMessage(payload)
  }


  private _emitMetricsUpdate(): void {
    const prev = { ...this.metrics }

    this.currentStreams = Math.floor(
      jitter(this.currentStreams, this.currentStreams, 0.001, 0.003),
    )
    this.currentListeners = Math.floor(
      clamp(jitter(this.currentListeners, this.currentListeners, 0.005, 0.01), 8000, 25000),
    )
    this.currentPeakRate = Math.floor(
      clamp(jitter(this.currentPeakRate, this.currentPeakRate, 0.02, 0.03), 400, 1200),
    )
    this.currentEngagement = clamp(
      jitter(this.currentEngagement, 91, 0.03, 0.005),
      75,
      99.9,
    )

    this.currentStreams += Math.floor(this.currentListeners / 60)

    const pctChange = (curr: number, p: number) =>
      p === 0 ? 0 : parseFloat((((curr - p) / p) * 100).toFixed(1))

    this.metrics = {
      totalStreams:           this.currentStreams,
      activeListeners:        this.currentListeners,
      peakStreamsPerMin:      this.currentPeakRate,
      engagementRate:         parseFloat(this.currentEngagement.toFixed(1)),
      totalStreamsDelta:      pctChange(this.currentStreams,    prev.totalStreams),
      activeListenersDelta:   pctChange(this.currentListeners,  prev.activeListeners),
      peakStreamsPerMinDelta: pctChange(this.currentPeakRate,   prev.peakStreamsPerMin),
      engagementRateDelta:    pctChange(this.currentEngagement, prev.engagementRate),
      capturedAt:             Date.now(),
    }

    const payload: StreamPayload = {
      type:       'metrics',
      data:       this.metrics,
      timestamp:  Date.now(),
      sequenceId: ++sequenceId,
    }

    this.onMessage(payload)
    this._emitArtistUpdate()
  }


  private _emitArtistUpdate(): void {
    if (this.artists.length === 0) return

    const point: Record<string, number> = { timestamp: Date.now() }

    this.artists.forEach((artist) => {
      const base = this.artistStreamRates[artist.id] || 1000
      this.artistStreamRates[artist.id] = clamp(
        Math.floor(jitter(base, base, 0.01, 0.05)),
        200,
        8000,
      )
      point[artist.id] = this.artistStreamRates[artist.id]
    })

    const payload: StreamPayload = {
      type:       'artist_update',
      data:       point,
      timestamp:  Date.now(),
      sequenceId: ++sequenceId,
    }
    this.onMessage(payload)
  }


  private _emitCandleUpdate(): void {
    const now      = Date.now()
    const minuteTs = Math.floor(now / 60_000) * 60_000

    this.candleBasePrice = clamp(
      jitter(this.candleBasePrice, this.candleBasePrice, 0.001, 0.008),
      50,
      500,
    )
    const newPrice = this.candleBasePrice

    const existing = this.candleBuffer.get(minuteTs)

    if (!existing) {
      this.candleBuffer.set(minuteTs, {
        open:   newPrice,
        high:   newPrice,
        low:    newPrice,
        close:  newPrice,
        volume: Math.floor(Math.random() * 500 + 100),
      })

      if (this.candleBuffer.size > 60) {
        const oldest = this.candleBuffer.keys().next().value
        if (oldest !== undefined) this.candleBuffer.delete(oldest)
      }
    } else {
      existing.high   = Math.max(existing.high, newPrice)
      existing.low    = Math.min(existing.low, newPrice)
      existing.close  = newPrice
      existing.volume += Math.floor(Math.random() * 50)
    }

    const candles: CandlePoint[] = Array.from(this.candleBuffer.entries()).map(
      ([ts, c]) => ({ timestamp: ts, ...c }),
    )

    const payload: StreamPayload = {
      type:       'candle_update',
      data:       candles,
      timestamp:  now,
      sequenceId: ++sequenceId,
    }

    this.onMessage(payload)
  }
}