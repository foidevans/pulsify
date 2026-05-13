<template>
  <div class="feed">
    <div class="feed__header">
      <span class="feed__title">Live Activity</span>
      <span class="feed__count">{{ filtered.length }} events</span>
    </div>

    <!-- Search + filter controls -->
    <div class="feed__controls">
      <div class="feed__search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          class="feed__search-input"
          placeholder="Search artist, track, city..."
          type="text"
        />
        <button v-if="searchQuery" class="feed__clear" @click="searchQuery = ''">✕</button>
      </div>

      <div class="feed__filters">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          :class="['filter-btn', { 'filter-btn--active': activeFilter === f.value }]"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div class="feed__list" ref="listEl">
      <TransitionGroup name="feed-item" tag="div">
        <div
          v-for="event in filtered"
          :key="event.id"
          :class="['feed__item', `feed__item--${event.severity ?? 'info'}`]"
        >
          <div class="feed__avatar">{{ event.userAvatar }}</div>

          <div class="feed__body">
            <div class="feed__name">{{ event.userName }}</div>
            <div class="feed__track">{{ event.trackName }}</div>
          </div>

          <div class="feed__meta">
            <div class="feed__city">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              {{ event.city }}
            </div>
            <div class="feed__time">{{ formatTime(event.timestamp) }}</div>
          </div>

          <div :class="['feed__type', `type--${event.eventType}`]">
            {{ eventLabel(event.eventType) }}
          </div>
        </div>
      </TransitionGroup>

      <div v-if="filtered.length === 0" class="feed__empty">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <span>No matching events</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { StreamEvent } from '../../types/index'
import { formatTime } from '../../utils/helpers'

interface Props {
  events: StreamEvent[]
}

const props  = defineProps<Props>()
const listEl = ref<HTMLDivElement | null>(null)

const searchQuery  = ref('')
const activeFilter = ref<'all' | StreamEvent['eventType']>('all')

const FILTERS: { label: string; value: 'all' | StreamEvent['eventType'] }[] = [
  { label: 'All',      value: 'all' },
  { label: '▶ Stream', value: 'stream' },
  { label: '♥ Like',   value: 'like' },
  { label: '↗ Share',  value: 'share' },
  { label: '⏭ Skip',   value: 'skip' },
]

const filtered = computed(() => {
  let list = props.events

  // Filter by event type
  if (activeFilter.value !== 'all') {
    list = list.filter((e) => e.eventType === activeFilter.value)
  }

  // Filter by search query
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(
      (e) =>
        e.trackName.toLowerCase().includes(q) ||
        e.artistName.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.userName.toLowerCase().includes(q),
    )
  }

  return list
})

function eventLabel(type: StreamEvent['eventType']): string {
  const map: Record<StreamEvent['eventType'], string> = {
    stream:       '▶ stream',
    like:         '♥ like',
    share:        '↗ share',
    playlist_add: '+ playlist',
    skip:         '⏭ skip',
  }
  return map[type] ?? type
}

watch(
  () => props.events.length,
  async () => {
    await nextTick()
    if (listEl.value) listEl.value.scrollTop = 0
  },
)
</script>

<style scoped>
.feed {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
}

.feed__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.feed__title {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.feed__count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: #535353;
}

/* ── Controls ─────────────────────────────────────── */
.feed__controls {
  padding: 0.6rem 1.25rem;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.feed__search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #282828;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 6px 10px;
  color: #535353;
  transition: border-color 0.2s;
}

.feed__search:focus-within {
  border-color: rgba(29, 185, 84, 0.4);
  color: #b3b3b3;
}

.feed__search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  color: #FFFFFF;
}

.feed__search-input::placeholder { color: #535353; }

.feed__clear {
  background: none;
  border: none;
  color: #535353;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0;
  line-height: 1;
}

.feed__clear:hover { color: #b3b3b3; }

.feed__filters {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #2a2a2a;
  background: transparent;
  color: #535353;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.68rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.filter-btn:hover { color: #b3b3b3; border-color: #3a3a3a; }

.filter-btn--active {
  background: rgba(29, 185, 84, 0.1);
  border-color: rgba(29, 185, 84, 0.35);
  color: #1DB954;
}

/* ── Feed list ───────────────────────────────────── */
.feed__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  scroll-behavior: smooth;
}

.feed__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.6rem 1.25rem;
  border-left: 2px solid transparent;
  transition: background 0.15s;
}

.feed__item:hover           { background: #252525; }
.feed__item--success        { border-left-color: #1DB954; }
.feed__item--warning        { border-left-color: #f59e0b; }
.feed__item--info           { border-left-color: transparent; }

.feed__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(29, 185, 84, 0.12);
  border: 1px solid rgba(29, 185, 84, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1DB954;
  flex-shrink: 0;
}

.feed__body  { flex: 1; min-width: 0; }

.feed__name {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed__track {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: #535353;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.feed__city {
  display: flex;
  align-items: center;
  gap: 3px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.7rem;
  color: #535353;
}

.feed__time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: #3a3a3a;
}

.feed__type {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.65rem;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}

.type--stream       { background: rgba(29,185,84,0.1);  color: #1DB954; }
.type--like         { background: rgba(236,72,153,0.1); color: #ec4899; }
.type--share        { background: rgba(6,182,212,0.1);  color: #06b6d4; }
.type--playlist_add { background: rgba(168,85,247,0.1); color: #a855f7; }
.type--skip         { background: rgba(245,158,11,0.1); color: #f59e0b; }

.feed__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2rem;
  color: #535353;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
}

.feed-item-enter-active { transition: all 0.3s ease-out; }
.feed-item-enter-from   { opacity: 0; transform: translateY(-8px); }
.feed-item-enter-to     { opacity: 1; transform: translateY(0); }
.feed-item-leave-active { display: none; }
</style>