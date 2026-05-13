import type { CircularBuffer } from  '../types'

export class CircularBufferImpl<T> implements CircularBuffer<T> {
  private buffer: T[]
  private head = 0
  private _length = 0
  private capacity: number

  constructor(capacity: number) {
    this.capacity = capacity
    this.buffer = new Array(capacity)
  }

  push(item: T): void {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.capacity
    if (this._length < this.capacity) {
      this._length++
    }
  }

  toArray(): T[] {
    if (this._length < this.capacity) {
      return this.buffer.slice(0, this._length)
    }
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ]
  }

  get length(): number {
    return this._length
  }

  clear(): void {
    this.head = 0
    this._length = 0
    this.buffer = new Array(this.capacity)
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}


export function jitter(
  current: number,
  base: number,
  drift = 0.1,
  volatility = 0.02,
): number {
  const noise = (Math.random() - 0.5) * 2 * volatility * base
  const pull = (base - current) * drift // mean-reversion
  return current + pull + noise
}


export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toFixed(0)
}


export function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour12: false })
}

export function formatTrend(trend: number): string {
  const sign = trend >= 0 ? '+' : ''
  return `${sign}${trend.toFixed(1)}%`
}

export function validatePayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  if (!p.type || !p.data || typeof p.timestamp !== 'number') return false
  if (!['metrics', 'event', 'track_update', 'artist_update', 'genre_update', 'candle_update'].includes(p.type as string)) {
    return false
  }
  return true
}

export function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .slice(0, 500) 
}