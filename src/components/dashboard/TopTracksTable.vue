<template>
  <div class="table-wrap">
    <div class="table-header">
      <span class="table-title">Top Tracks This Week</span>
    </div>

    <div class="table-scroll">
      <table class="tracks-table">
        <thead>
          <tr>
            <th class="col-rank">Rank</th>
            <th class="col-track">Track</th>
            <th class="col-artist">Artist</th>
            <th class="col-streams">Streams</th>
            <th class="col-trend">Trend</th>
          </tr>
        </thead>
        <tbody>
          <TransitionGroup name="row" tag="tbody">
            <tr
              v-for="track in tracks"
              :key="track.id"
              class="track-row"
            >
              <td class="col-rank">
                <span :class="['rank-badge', rankClass(track.rank)]">
                  {{ track.rank }}
                </span>
              </td>
              <td class="col-track">{{ track.name }}</td>
              <td class="col-artist">{{ track.artist }}</td>
              <td class="col-streams">{{ formatNumber(track.streams) }}</td>
              <td class="col-trend">
                <span :class="track.trend >= 0 ? 'trend-up' : 'trend-down'">
                  {{ track.trend >= 0 ? '▲' : '▼' }}
                  {{ Math.abs(track.trend).toFixed(1) }}%
                </span>
              </td>
            </tr>
          </TransitionGroup>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Track } from '../../types/index'
import { formatNumber } from '../../utils/helpers'

interface Props {
  tracks: Track[]
}

defineProps<Props>()

function rankClass(rank: number): string {
  if (rank === 1) return 'rank--gold'
  if (rank === 2) return 'rank--silver'
  if (rank === 3) return 'rank--bronze'
  return 'rank--default'
}
</script>

<style scoped>
.table-wrap {
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table-header {
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.table-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.table-scroll {
  overflow-y: auto;
  flex: 1;
}

.tracks-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'DM Sans', sans-serif;
}

thead tr {
  position: sticky;
  top: 0;
  background: #1a1a1a;
  z-index: 1;
}

th {
  font-size: 0.7rem;
  font-weight: 600;
  color: #535353;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.6rem 1rem;
  text-align: left;
  border-bottom: 1px solid #2a2a2a;
}

.track-row {
  border-bottom: 1px solid #1a1a1a;
  transition: background 0.15s;
}

.track-row:hover { background: #252525; }
.track-row:last-child { border-bottom: none; }

td {
  padding: 0.65rem 1rem;
  font-size: 0.82rem;
  color: #FFFFFF;
  white-space: nowrap;
}

.col-rank    { width: 60px; }
.col-track   { font-weight: 500; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
.col-artist  { color: #b3b3b3; max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
.col-streams { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: #b3b3b3; }
.col-trend   { width: 90px; }

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
}

.rank--gold    { background: rgba(255,198,0,0.15);  color: #ffc600; }
.rank--silver  { background: rgba(179,179,179,0.15); color: #b3b3b3; }
.rank--bronze  { background: rgba(205,127,50,0.15); color: #cd7f32; }
.rank--default { background: rgba(83,83,83,0.2);    color: #535353; }

.trend-up   { color: #1DB954; font-size: 0.75rem; font-weight: 600; }
.trend-down { color: #ef4444; font-size: 0.75rem; font-weight: 600; }
</style>