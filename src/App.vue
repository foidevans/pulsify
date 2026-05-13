<template>
  <div class="app-root" :class="uiStore.theme">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useDataStream } from './composables/useDataStream'
import { useUIStore } from './stores/uiStore'

const uiStore  = useUIStore()
const { init } = useDataStream()

watch(
  () => uiStore.theme,
  (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
  },
  { immediate: true },
)

onMounted(() => init())
</script>

<style>
.app-root {
  min-height: 100vh;
  transition: background 0.3s, color 0.3s;
}

.app-root.dark {
  --bg-base:        #191414;
  --bg-surface:     #121212;
  --bg-card:        #1f1f1f;
  --bg-card-hover:  #282828;
  --border-subtle:  #2a2a2a;
  --text-primary:   #FFFFFF;
  --text-secondary: #b3b3b3;
  --text-muted:     #535353;
  background-color: #191414;
  color: #FFFFFF;
}

.app-root.light {
  --bg-base:        #f5f5f5;
  --bg-surface:     #ebebeb;
  --bg-card:        #FFFFFF;
  --bg-card-hover:  #f0f0f0;
  --border-subtle:  #e0e0e0;
  --text-primary:   #191414;
  --text-secondary: #4a4a4a;
  --text-muted:     #888888;
  background-color: #f5f5f5;
  color: #191414;
}
</style>