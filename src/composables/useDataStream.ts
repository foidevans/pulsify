import { onUnmounted, watch } from 'vue'
import { MockWebSocket } from '../utils/mockDataGenerator'
import { fetchSeedData } from '../utils/lastfmService'
import { useStreamStore } from '../stores/streamStore'
import { useUIStore } from '../stores/uiStore'

let ws: MockWebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const TARGET_FPS = 60
const FRAME_MS   = 1000 / TARGET_FPS   

let lastFlush    = 0
let pendingQueue: unknown[] = []
let rafId: number | null = null

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_BASE_DELAY   = 1000


function scheduleFlush(streamStore: ReturnType<typeof useStreamStore>, uiStore: ReturnType<typeof useUIStore>) {
  if (rafId !== null) return

  rafId = requestAnimationFrame((now) => {
    rafId = null

    if (uiStore.isPaused) {
      pendingQueue = []
      return
    }

    if (now - lastFlush < FRAME_MS) {
      scheduleFlush(streamStore, uiStore)
      return
    }

    lastFlush = now

    const batch = pendingQueue.splice(0)
    for (const payload of batch) {
      streamStore.processPayload(payload)
    }
  })
}

export function useDataStream() {
  const streamStore = useStreamStore()
  const uiStore     = useUIStore()

  async function init() {
    uiStore.setLoading(true)
    uiStore.setStreamStatus('connecting')

    try {
      const seedData = await fetchSeedData()
      streamStore.setSeedData(seedData)

      ws = new MockWebSocket(
        (payload) => {
          pendingQueue.push(payload)
          scheduleFlush(streamStore, uiStore)
        },
        (status) => {
          if (status === 'open') {
            uiStore.setStreamStatus('live')
            uiStore.setLoading(false)
          } else if (status === 'close') {
            _scheduleReconnect()
          } else if (status === 'error') {
            uiStore.setError('Stream connection error')
          }
        },
      )

      ws.seed(seedData)
      ws.connect()
    } catch (err) {
      console.error('[useDataStream] Init failed', err)
      uiStore.setError('Failed to initialize. Retrying...')
      uiStore.setLoading(false)
      _scheduleReconnect()
    }
  }

  function _scheduleReconnect() {
    if (uiStore.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      uiStore.setError('Connection lost. Please refresh.')
      return
    }
    uiStore.incrementReconnect()
    const delay = RECONNECT_BASE_DELAY * Math.pow(2, uiStore.reconnectAttempts - 1)
    reconnectTimer = setTimeout(() => init(), delay)
  }

  function cleanup() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    pendingQueue = []
    if (ws) {
      ws.disconnect()
      ws = null
    }
    streamStore.clearAll()
  }

  watch(
    () => uiStore.isPaused,
    (paused) => {
      if (!ws) return
      paused ? ws.pause() : ws.resume()
    },
  )

  onUnmounted(() => cleanup())

  return { init, cleanup }
}