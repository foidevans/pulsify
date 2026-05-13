<template>
  <span :class="['badge', `badge--${variant}`]">
    <span v-if="pulse" class="badge__dot" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
interface Props {
  label: string
  variant?: 'live' | 'paused' | 'error' | 'reconnecting'
  pulse?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'live',
  pulse: true,
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
}

.badge--live {
  color: #1DB954;
  background: rgba(29, 185, 84, 0.1);
  border: 1px solid rgba(29, 185, 84, 0.25);
}

.badge--paused {
  color: #b3b3b3;
  background: rgba(179, 179, 179, 0.08);
  border: 1px solid rgba(179, 179, 179, 0.2);
}

.badge--error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.badge--reconnecting {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.75); }
}
</style>