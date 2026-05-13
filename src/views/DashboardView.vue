<template>
  <div class="dashboard">
    <DashboardHeader />

    <!-- Loading state -->
    <div v-if="uiStore.isLoading" class="dashboard__loading">
      <div class="loading-grid">
        <SkeletonLoader v-for="n in 4" :key="n" height="110px" />
      </div>
      <div class="loading-grid loading-grid--2">
        <SkeletonLoader v-for="n in 4" :key="n" height="260px" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="uiStore.error" class="dashboard__error">
      <p>⚠ {{ uiStore.error }}</p>
    </div>

    <!-- Main dashboard -->
    <main v-else class="dashboard__main">

      <!-- Row 1: Metric cards -->
      <section class="metrics-grid">
        <MetricCard
          label="Total Streams"
          :value="metrics.totalStreams"
          :delta="metrics.totalStreamsDelta"
          format="number"
          icon-path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          icon-color="#1DB954"
          icon-bg="rgba(29,185,84,0.12)"
        />
        <MetricCard
          label="Active Listeners"
          :value="metrics.activeListeners"
          :delta="metrics.activeListenersDelta"
          format="number"
          icon-path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          icon-color="#a855f7"
          icon-bg="rgba(168,85,247,0.12)"
        />
        <MetricCard
          label="Peak Streams/Min"
          :value="metrics.peakStreamsPerMin"
          :delta="metrics.peakStreamsPerMinDelta"
          format="number"
          icon-path="M22 12h-4l-3 9L9 3l-3 9H2"
          icon-color="#06b6d4"
          icon-bg="rgba(6,182,212,0.12)"
        />
        <MetricCard
          label="Engagement Rate"
          :value="metrics.engagementRate"
          :delta="metrics.engagementRateDelta"
          format="percent"
          icon-path="M13 10V3L4 14h7v7l9-11h-7z"
          icon-color="#f59e0b"
          icon-bg="rgba(245,158,11,0.12)"
        />
      </section>

      <!-- Row 2: Streams by Artist + Top Genres -->
      <section class="two-col-grid">
        <div class="card">
          <MultiLineChart
            title="Streams by Artist"
            :artists="activeArtists"
            :series="windowedArtistSeries"
            :active-artist-ids="uiStore.selectedArtistIds"
            :height="chartHeight"
            @toggle-artist="uiStore.toggleArtist"
          />
        </div>
        <div class="card">
          <BarChart
            title="Top Genres"
            :data="sortedGenres"
            :height="chartHeight"
            :orientation="uiStore.genreChartOrientation"
          />
        </div>
      </section>

      <!-- Row 3: Heatmap + Artist Profile -->
      <section class="two-col-grid">
        <div class="card">
          <HeatmapChart
            title="Stream Activity Heatmap"
            :height="chartHeight"
          />
        </div>
        <div class="card">
          <RadarChart
            title="Artist Profile"
            :data="primaryArtistRadar"
            :height="chartHeight"
          />
        </div>
      </section>

      <!-- Row 4: Cumulative Streams + Regional Distribution -->
      <section class="two-col-grid">
        <div class="card">
          <CumulativeAreaChart
            title="Cumulative Streams"
            :data="cumulativeWeekly"
            :height="chartHeight"
          />
        </div>
        <div class="card">
          <PieChart
            title="Regional Distribution"
            :data="regions"
            :height="chartHeight"
          />
        </div>
      </section>

      <!-- Row 5: Candlestick full width (bonus) -->
      <section class="full-row">
        <div class="card" style="height: 100%;">
          <CandlestickChart
            title="Pulsify Index — Price Action"
            :data="streamStore.candleData"
            :height="300"
          />
        </div>
      </section>

      <!-- Row 6: Activity Feed + Top Tracks -->
      <section class="two-col-grid">
        <ActivityFeed :events="streamStore.activityFeed" />
        <TopTracksTable :tracks="topTracks" />
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStreamStore } from '../stores/streamStore'
import { useUIStore } from '../stores/uiStore'
import { useChartData } from '../composables/useChartData'

import DashboardHeader     from '../components/dashboard/DashboardHeader.vue'
import MetricCard          from '../components/dashboard/MetricCard.vue'
import ActivityFeed        from '../components/dashboard/ActivityFeed.vue'
import TopTracksTable      from '../components/dashboard/TopTracksTable.vue'
import SkeletonLoader      from '../components/ui/SkeletonLoader.vue'
import MultiLineChart      from '../components/charts/MultiLineChart.vue'
import BarChart            from '../components/charts/BarChart.vue'
import PieChart            from '../components/charts/PieChart.vue'
import RadarChart          from '../components/charts/RadarChart.vue'
import CumulativeAreaChart from '../components/charts/CumulativeAreaChart.vue'
import HeatmapChart        from '../components/charts/HeatmapChart.vue'
import CandlestickChart    from '../components/charts/CandlestickChart.vue'

const streamStore = useStreamStore()
const uiStore     = useUIStore()
const { currentMetrics: metrics } = storeToRefs(streamStore)

const {
  windowedArtistSeries,
  activeArtists,
  sortedGenres,
  primaryArtistRadar,
  cumulativeWeekly,
  topTracks,
  regions,
} = useChartData()

const chartHeight = computed(() => window.innerWidth < 640 ? 180 : 240)
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
}

.dashboard__loading,
.dashboard__error {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard__error {
  color: #ef4444;
  font-family: 'DM Sans', sans-serif;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.dashboard__main {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.full-row {
  height: 340px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  transition: border-color 0.2s, background 0.3s;
}

.card:hover {
  border-color: rgba(29, 185, 84, 0.15);
  background: var(--bg-card-hover);
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.loading-grid--2 {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 1024px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .loading-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .dashboard__main { padding: 1rem; }
  .metrics-grid,
  .two-col-grid,
  .loading-grid,
  .loading-grid--2 { grid-template-columns: 1fr; }
  .full-row { height: auto; min-height: 300px; }
}
</style>