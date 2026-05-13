<template>
  <header class="header">
    <div class="header__brand">
      <div class="header__logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="14" fill="#1DB954" />
          <path
            d="M8 10.5c3.5-1.2 7.5-1.2 11 0M7 14c4.5-1.5 9.5-1.5 14 0M9 17.5c3-1 7-1 10 0"
            stroke="#191414"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <div>
        <h1 class="header__title">PULSIFY</h1>
        <p class="header__subtitle">Real-time Music Analytics</p>
      </div>
    </div>

    <div class="header__controls">
      <StatusBadge
        :label="uiStore.isPaused ? 'Paused' : uiStore.streamStatus"
        :variant="badgeVariant"
        :pulse="uiStore.streamStatus === 'live' && !uiStore.isPaused"
      />

      <!-- Chart type switcher -->
      <div class="chart-toggle" title="Switch genre chart orientation">
        <button
          :class="['toggle-btn', { 'toggle-btn--active': uiStore.genreChartOrientation === 'horizontal' }]"
          @click="uiStore.setGenreChartOrientation('horizontal')"
          title="Horizontal bars"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 6h12M3 12h18M3 18h8"/>
          </svg>
        </button>
        <button
          :class="['toggle-btn', { 'toggle-btn--active': uiStore.genreChartOrientation === 'vertical' }]"
          @click="uiStore.setGenreChartOrientation('vertical')"
          title="Vertical bars"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 3v12M12 3v18M18 3v8"/>
          </svg>
        </button>
      </div>

      <!-- Pause/Resume -->
      <button class="btn-pause" @click="uiStore.togglePause">
        <span class="btn-pause__icon">
          <svg v-if="!uiStore.isPaused" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1.5" y="1" width="3" height="10" rx="1" />
            <rect x="7.5" y="1" width="3" height="10" rx="1" />
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 1.5l9 4.5-9 4.5V1.5z" />
          </svg>
        </span>
        {{ uiStore.isPaused ? 'Resume' : 'Pause' }}
      </button>

      <!-- Time range -->
      <div class="time-range">
        <button
          v-for="range in timeRanges"
          :key="range.value"
          :class="['time-btn', { 'time-btn--active': uiStore.timeRange === range.value }]"
          @click="uiStore.setTimeRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>

      <!-- Light / dark toggle -->
      <button class="btn-theme" @click="uiStore.toggleTheme" :title="uiStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
        <svg v-if="uiStore.theme === 'dark'" width="15" height="15" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg v-else width="15" height="15" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '../../stores/uiStore'
import StatusBadge from '../ui/StatusBadge.vue'
import type { TimeRange } from '../../types/index'

const uiStore = useUIStore()

const timeRanges: { label: string; value: TimeRange }[] = [
  { label: 'Live', value: 'live' },
  { label: '1m',   value: '1m' },
  { label: '5m',   value: '5m' },
  { label: '15m',  value: '15m' },
  { label: '1h',   value: '1h' },
]

const badgeVariant = computed(() => {
  if (uiStore.isPaused) return 'paused'
  if (uiStore.streamStatus === 'error') return 'error'
  if (uiStore.streamStatus === 'reconnecting') return 'reconnecting'
  return 'live'
})
</script>
<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header__logo { flex-shrink: 0; }

.header__title {
  font-family: 'Syne', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.12em;
  line-height: 1;
  margin: 0;
}

.header__subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin: 3px 0 0;
}

.header__controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── Chart type toggle ─────────────────────────────── */
.chart-toggle {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn:hover {
  color: var(--text-secondary);
  background: var(--border-subtle);
}

.toggle-btn--active {
  background: rgba(29, 185, 84, 0.12);
  color: #1DB954;
}

/* ── Pause button ──────────────────────────────────── */
.btn-pause {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pause:hover {
  border-color: #1DB954;
  color: #1DB954;
  background: rgba(29, 185, 84, 0.08);
}

.btn-pause__icon { display: flex; align-items: center; }

/* ── Time range ────────────────────────────────────── */
.time-range {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 3px;
}

.time-btn {
  padding: 4px 12px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
}

.time-btn:hover { color: var(--text-secondary); }

.time-btn--active {
  background: var(--border-subtle);
  color: var(--text-primary);
}

/* ── Theme toggle ──────────────────────────────────── */
.btn-theme {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-theme:hover {
  border-color: #1DB954;
  color: #1DB954;
  background: rgba(29, 185, 84, 0.08);
}

@media (max-width: 640px) {
  .header { padding: 0.875rem 1rem; }
  .time-range { display: none; }
  .chart-toggle { display: none; }
}
</style>