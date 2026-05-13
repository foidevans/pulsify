<template>
  <div class="metric-card">
    <div class="metric-card__top">
      <span class="metric-card__label">{{ label }}</span>
      <div class="metric-card__icon" :style="{ background: iconBg }">
        <svg :width="18" :height="18" viewBox="0 0 24 24" fill="none"
             :stroke="iconColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="iconPath" />
        </svg>
      </div>
    </div>

    <div class="metric-card__value-row">
      <span :key="displayValue" class="metric-card__value animate-count-up">
        {{ displayValue }}
      </span>
    </div>

    <div class="metric-card__footer">
      <span :class="['metric-card__delta', delta >= 0 ? 'delta--up' : 'delta--down']">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path v-if="delta >= 0" d="M5 1L9 7H1L5 1z" />
          <path v-else d="M5 9L1 3H9L5 9z" />
        </svg>
        {{ Math.abs(delta).toFixed(1) }}%
      </span>
      <span class="metric-card__period">vs last interval</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '../../utils/helpers'

interface Props {
  label: string
  value: number
  delta: number
  format?: 'number' | 'decimal' | 'percent'
  iconPath: string
  iconColor?: string
  iconBg?: string
}

const props = withDefaults(defineProps<Props>(), {
  format: 'number',
  iconColor: '#1DB954',
  iconBg: 'rgba(29, 185, 84, 0.12)',
})

const displayValue = computed(() => {
  if (props.format === 'percent') return `${props.value.toFixed(1)}%`
  if (props.format === 'decimal') return props.value.toFixed(1)
  return formatNumber(props.value)
})
</script>

<style scoped>
.metric-card {
  background: #1f1f1f;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s, background 0.2s;
}

.metric-card:hover {
  border-color: rgba(29, 185, 84, 0.2);
  background: #252525;
}

.metric-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-card__label {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  color: #b3b3b3;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-card__icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-card__value-row {
  overflow: hidden;
}

.metric-card__value {
  display: block;
  font-family: 'Syne', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.03em;
  line-height: 1;
}

.animate-count-up {
  animation: count-up 0.35s ease-out both;
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.metric-card__footer {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metric-card__delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
}

.delta--up   { color: #1DB954; }
.delta--down { color: #ef4444; }

.metric-card__period {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.72rem;
  color: #535353;
}
</style>