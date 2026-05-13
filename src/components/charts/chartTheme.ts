export const SPOTIFY_COLORS = {
  green:         '#1DB954',
  bright:        '#1ED760',
  black:         '#191414',
  white:         '#FFFFFF',
  surface:       '#1f1f1f',
  border:        '#2a2a2a',
  textPrimary:   '#FFFFFF',
  textSecondary: '#b3b3b3',
  textMuted:     '#535353',
}


export const SERIES_COLORS = [
  '#1DB954', // green  (Spotify)
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#ef4444', // red
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#84cc16', // lime
]


export const GENRE_COLORS = [
  '#1ED760', // Hip-Hop    — brighter Spotify green (longest bar)
  '#1DB954', // Pop        — Spotify green
  '#a855f7', // R&B        — purple
  '#06b6d4', // Electronic — cyan
  '#ef4444', // Indie      — red/coral
]

export const ARTIST_LINE_COLORS = [
  '#a855f7', // purple (artist 1)
  '#06b6d4', // cyan   (artist 2)
  '#1DB954', // green  (artist 3)
  '#ec4899', // pink   (artist 4)
  '#f59e0b', // amber  (artist 5)
  '#ef4444', // red    (artist 6)
]


export const REGION_COLORS = [
  '#1DB954', // North America — Spotify green (largest slice)
  '#a855f7', // Europe
  '#06b6d4', // Asia Pacific
  '#ec4899', // Latin America
  '#ef4444', // Africa
]

/** Base tooltip style */
export const baseTooltip = {
  backgroundColor: '#282828',
  borderColor: '#2a2a2a',
  borderWidth: 1,
  textStyle: {
    color: '#FFFFFF',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 12,
  },
  extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.5); border-radius: 8px;',
}

/** Base grid */
export const baseGrid = (opts?: {
  top?: string | number
  right?: string | number
  bottom?: string | number
  left?: string | number
}) => ({
  top:          opts?.top    ?? '12%',
  right:        opts?.right  ?? '3%',
  bottom:       opts?.bottom ?? '12%',
  left:         opts?.left   ?? '3%',
  containLabel: true,
})

/** Base X-axis for time-series */
export const baseTimeXAxis = {
  type: 'time' as const,
  axisLine: { lineStyle: { color: '#2a2a2a' } },
  axisTick: { show: false },
  axisLabel: {
    color: '#535353',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 11,
  },
  splitLine: { show: false },
}

/** Base X-axis for category data */
export const baseCategoryXAxis = (data: string[]) => ({
  type: 'category' as const,
  data,
  axisLine: { lineStyle: { color: '#2a2a2a' } },
  axisTick: { show: false },
  axisLabel: {
    color: '#535353',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 11,
    interval: 0,
  },
  splitLine: { show: false },
})

/** Base Y-axis */
export const baseYAxis = (opts?: { formatter?: (v: number) => string }) => ({
  type: 'value' as const,
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: {
    color: '#535353',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: 11,
    formatter: opts?.formatter,
  },
  splitLine: {
    lineStyle: { color: '#2a2a2a', type: 'dashed' as const },
  },
})

/** Smooth gradient area fill */
export function areaGradient(color: string, opacity = 0.35) {
  return {
    type: 'linear',
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: color + Math.round(opacity * 255).toString(16).padStart(2, '0') },
      { offset: 1, color: color + '00' },
    ],
  }
}