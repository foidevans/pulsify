# Pulsify — Real-time Music Analytics Dashboard

A high-performance real-time analytics dashboard built with Vue 3 + TypeScript, visualizing live music streaming data with smooth updates, advanced charts, and interactive insights.

![Pulsify Dashboard](/public/pulsify-dahboard.png) 

---

## What is Pulsify?

Pulsify simulates a production-grade music streaming analytics platform, think Spotify for Artists meets a trading terminal. It seeds real artist and track data from the Last.fm public API, then simulates live streaming fluctuations on top of that real data through a mock WebSocket architecture that emits updates every second.

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/foidevans/pulsify.git
cd pulsify

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`

### Build for production

```bash
npm run build
npm run preview
```

### Type checking

```bash
npm run typecheck
```

---

## Architecture Overview

```
src/
├── types/              # All TypeScript interfaces — single source of truth
├── utils/
│   ├── helpers.ts      # CircularBuffer, validators, sanitizers, formatters
│   ├── lastfmService.ts    # Last.fm API fetch + fallback seed data
│   └── mockDataGenerator.ts  # MockWebSocket class — streaming engine
├── stores/
│   ├── streamStore.ts  # Real-time data — metrics, events, tracks, candles
│   └── uiStore.ts      # UI state — theme, pause, time range, filters
├── composables/
│   ├── useDataStream.ts    # Stream lifecycle — init, RAF throttle, reconnect
│   └── useChartData.ts     # Time-windowed data selectors for charts
├── components/
│   ├── charts/         # 8 reusable ECharts components
│   ├── dashboard/      # Header, MetricCard, ActivityFeed, TopTracksTable
│   └── ui/             # StatusBadge, SkeletonLoader
├── views/
│   └── DashboardView.vue   # Root dashboard layout
└── router/
    └── index.ts
```

### Key design decisions

**Layered architecture** — data flows in one direction:

```
Last.fm API / MockWebSocket
        ↓
  useDataStream (composable) — throttles, validates, routes
        ↓
  Pinia Stores (streamStore + uiStore) — single source of truth
        ↓
  useChartData (composable) — computes windowed slices
        ↓
  Chart components — read-only, never write to store
```

Charts never talk to the store directly. They receive data as props from `DashboardView` via `useChartData` selectors. This means chart components are fully reusable and testable in isolation.

---

## State Management Strategy

### Why Pinia over Vuex

Pinia was chosen over Vuex because it is the official Vue 3 state manager with full TypeScript support out of the box, no mutations boilerplate, and a composition API style that matches the rest of the codebase.

### Store separation

**`streamStore`** owns all real-time data:
- `currentMetrics` — latest snapshot (totalStreams, activeListeners, peakStreamsPerMin, engagementRate)
- `metricsHistory` — circular buffer of 300 time-series points (~5 minutes at 1 update/sec)
- `activityFeed` — circular buffer of 100 most recent stream events
- `artistSeries` — circular buffer of 120 artist time-series points
- `candleData` — rolling 60-candle OHLC window
- `tracks`, `artists`, `genres`, `regions` — seeded from Last.fm, updated via streaming deltas

**`uiStore`** owns all UI state:
- `theme` — dark / light
- `isPaused` — streaming paused state
- `timeRange` — Live / 1m / 5m / 15m / 1h
- `selectedArtistIds` — toggled artists in MultiLineChart
- `genreChartOrientation` — horizontal / vertical bar toggle
- `streamStatus` — connecting / live / paused / error / reconnecting
- `searchQuery` — activity feed search input

### shallowRef on large arrays

All large arrays in `streamStore` use `shallowRef` instead of `ref`. Vue's deep reactivity tracking on arrays of 100-300 objects would fire watchers on every nested property mutation. `shallowRef` only triggers when the reference itself is replaced, which we control explicitly by assigning a new array from the circular buffer on each update.

---

## Rendering Optimization Decisions

### 1. RequestAnimationFrame throttle

Incoming stream payloads are queued and flushed in batches on each animation frame (max 60fps) rather than processed immediately on every WebSocket message. This prevents render storms when the generator emits faster than the browser can paint.

```
MockWebSocket emits → pendingQueue.push() → rAF fires → batch process → store update → Vue re-render
```

### 2. Circular buffer — O(1) push, fixed memory

Instead of `.push()` on a growing array (which would leak memory over a long session), all time-series data uses a fixed-capacity circular buffer. When full, the oldest entry is silently overwritten. No garbage collection pressure, no memory growth.

- `metricsHistory` — 300 points (~7.5 minutes)
- `activityFeed` — 100 events
- `artistSeries` — 120 points (~3 minutes)

### 3. ECharts partial updates

Charts never call `setOption` with a full dataset replacement on every tick. Instead:

- **Time-series charts** use `setOption({ series: [{ data: newData }] }, { replaceMerge: ['series'] })` — only the series data array is diffed, axes and config are untouched
- **Canvas renderer with `useDirtyRect: true`** — ECharts only repaints the canvas regions that actually changed, not the entire canvas

### 4. ResizeObserver cleanup

Every chart component creates a `ResizeObserver` in `onMounted` and calls `disconnect()` in `onUnmounted`. The ECharts instance is also explicitly `dispose()`d on unmount. This prevents the most common source of memory leaks in dashboard applications — orphaned event listeners holding references to destroyed component instances.

### 5. Computed selectors via useChartData

Chart components never read raw store state. `useChartData` exposes computed refs that apply the time window filter, artist filter, and data transformations. Vue's computed caching means these only recompute when their specific dependencies change — a metrics update does not recompute `sortedGenres` or `primaryArtistRadar`.

---

## Data Streaming Approach

### Hybrid strategy

On application load, Pulsify makes a single API call to the Last.fm public charts endpoint to fetch real top tracks with real artist names, real listener counts, and real chart positions. This data seeds the dashboard with authentic baseline numbers.

If Last.fm is unavailable (network failure, rate limit), the app falls back gracefully to a hardcoded seed dataset of well-known tracks — the user sees no error and the dashboard works identically.

### MockWebSocket architecture

After seeding, a `MockWebSocket` class takes over and simulates continuous streaming:

```
connect() → 600ms handshake delay → onStatus('open') → _startStreaming()
  ├── Stream events every 600–1200ms (randomised for realism)
  │     └── random user, track, city → StreamEvent payload
  │     └── track_update payload (increments stream count)
  ├── Metrics update every 1500ms
  │     └── mean-reverting random walk on totalStreams, activeListeners, peakRate, engagement
  │     └── artist_update payload (per-artist stream rates)
  └── Candle update every 3000ms
        └── 1-minute OHLC buckets, rolling 60-candle window
```

### Mean-reversion simulation

All streaming metrics use a mean-reverting random walk (`jitter()` in helpers.ts) rather than pure random noise. This means values fluctuate realistically — they drift away from a baseline and are pulled back toward it — instead of random-walking to extreme values over time.

### Payload validation

Every incoming payload passes through `validatePayload()` before touching the store. Type-unknown payloads are counted as `droppedPayloads` and silently discarded. All string fields from external sources pass through `sanitizeString()` which strips HTML characters, preventing XSS injection from malformed API responses.

---

## Charts

| Chart | Component | Data source | Update frequency |
|---|---|---|---|
| Streams by Artist | MultiLineChart | artistSeries buffer | Every 1.5s |
| Top Genres | BarChart | genres (seed + deltas) | Every 1.5s |
| Stream Activity Heatmap | HeatmapChart | Internal generator | Every 5s |
| Artist Profile | RadarChart | artists[0] static profile | On seed |
| Cumulative Streams | CumulativeAreaChart | cumulativeWeekly computed | Every 1.5s |
| Regional Distribution | PieChart | regions (seed) | Static |
| Pulsify Index | CandlestickChart | candleData buffer | Every 3s |
| Activity Feed | ActivityFeed | activityFeed buffer | Every 0.6–1.2s |
| Top Tracks | TopTracksTable | topTracks computed | Every stream event |
| Metric Cards ×4 | MetricCard | currentMetrics | Every 1.5s |

---

## Trade-offs Made

### Mock WebSocket vs real WebSocket server

**Decision:** Mock WebSocket class instead of a real server.

**Reasoning:** The task requires no backend. A mock class gives identical architecture to a real WebSocket (same connect/disconnect/onMessage interface, same reconnect logic) while being self-contained and working offline. The generator is honest about what it is — it is not disguised as a real connection.

**Trade-off:** Stream data is simulated, not real. A real implementation would replace `MockWebSocket` with a native `WebSocket` pointing at a server, with no changes to the composable or store layers — the interface is identical.

### ECharts vs D3

**Decision:** ECharts over D3.

**Reasoning:** ECharts provides declarative chart configuration with built-in canvas rendering, `useDirtyRect` for partial repaints, and `replaceMerge` for efficient updates — all critical for a 60fps real-time dashboard. D3 gives more control but requires manual rendering logic for every chart type, significantly increasing implementation complexity for no perceptible quality gain at this scale.

**Trade-off:** ECharts adds ~400KB to the bundle. Mitigated by tree-shaking — only the chart types actually used are imported in `main.ts`.

### Pinia vs TanStack Query

**Decision:** Pinia only, no TanStack Query.

**Reasoning:** TanStack Query excels at server state — fetching, caching, and refetching REST data. Pulsify's data is streaming (push-based), not request-based (pull-based). Pinia's reactive stores are a better fit for managing a continuous stream of incoming payloads that need to be processed, windowed, and exposed to multiple components simultaneously.

### shallowRef vs ref for large arrays

**Decision:** `shallowRef` on all large reactive arrays.

**Trade-off:** Mutations to nested objects inside the array do not trigger reactivity. We work around this by always replacing the array reference (assigning `buffer.toArray()`) rather than mutating in place. This is a deliberate constraint that improves performance significantly — Vue does not have to walk 300-item arrays looking for changed properties on every update.

### Circular buffer vs sliding window array

**Decision:** Custom `CircularBufferImpl` class.

**Trade-off:** More complex than a simple `array.push(); if (array.length > MAX) array.shift()`. The `shift()` approach is O(n) — it moves every element in memory on each call. The circular buffer is O(1) for both push and read. At 60fps with 300-item buffers this difference is measurable.

---

## Security

- All string fields from external sources (Last.fm API, simulated user names, track names, city names) pass through `sanitizeString()` before being stored or rendered
- `validatePayload()` checks type, shape and allowed payload type strings before processing — unknown payload types are dropped
- No `innerHTML`, `v-html`, or direct DOM manipulation anywhere in the codebase
- Intervals, timeouts, ResizeObservers, and ECharts instances are all cleaned up in `onUnmounted` hooks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API) |
| Language | TypeScript 5.4 (strict mode) |
| Build tool | Vite 5 + @tailwindcss/vite |
| State | Pinia 2 |
| Charts | ECharts 5 (tree-shaken) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Data seed | Last.fm public API |
| Fonts | Syne (display) + DM Sans (body) + JetBrains Mono |

---

## License

MIT

## Author

Favour Evans