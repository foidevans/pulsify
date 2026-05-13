import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimeRange, StreamStatus } from '../types'

export const useUIStore = defineStore('ui', () => {
  const timeRange               = ref<TimeRange>('live')
  const isPaused                = ref(false)
  const theme                   = ref<'dark' | 'light'>('dark')
  const streamStatus            = ref<StreamStatus>('connecting')
  const isLoading               = ref(true)
  const error                   = ref<string | null>(null)
  const selectedArtistIds       = ref<string[]>([])
  const searchQuery             = ref('')
  const reconnectAttempts       = ref(0)
  const genreChartOrientation   = ref<'horizontal' | 'vertical'>('horizontal')

  const isLive = computed(() => streamStatus.value === 'live' && !isPaused.value)

  const statusLabel = computed(() =>
    isPaused.value ? 'Paused' : streamStatus.value.charAt(0).toUpperCase() + streamStatus.value.slice(1)
  )

  function setStreamStatus(status: StreamStatus) {
    streamStatus.value = status
    if (status === 'live') {
      error.value = null
      reconnectAttempts.value = 0
    }
  }

  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTimeRange(range: TimeRange) {
    timeRange.value = range
  }

  function setError(msg: string | null) {
    error.value = msg
    if (msg) streamStatus.value = 'error'
  }

  function setLoading(val: boolean) {
    isLoading.value = val
  }

  function toggleArtist(id: string) {
    if (selectedArtistIds.value.includes(id)) {
      selectedArtistIds.value = selectedArtistIds.value.filter((a) => a !== id)
    } else {
      selectedArtistIds.value = [...selectedArtistIds.value, id]
    }
  }

  function incrementReconnect() {
    reconnectAttempts.value++
    streamStatus.value = 'reconnecting'
  }

  function setGenreChartOrientation(orientation: 'horizontal' | 'vertical') {
    genreChartOrientation.value = orientation
  }

  return {
    timeRange,
    isPaused,
    theme,
    streamStatus,
    isLoading,
    error,
    selectedArtistIds,
    searchQuery,
    reconnectAttempts,
    genreChartOrientation,
    isLive,
    statusLabel,
    setStreamStatus,
    togglePause,
    toggleTheme,
    setTimeRange,
    setError,
    setLoading,
    toggleArtist,
    incrementReconnect,
    setGenreChartOrientation,
  }
})