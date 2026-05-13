<template>
  <div
    class="skeleton"
    :style="{
      width: width,
      height: height,
      borderRadius: rounded ? '999px' : '6px',
    }"
  />
</template>

<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  rounded?: boolean
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
  rounded: false,
})
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    #1f1f1f 25%,
    #2a2a2a 50%,
    #1f1f1f 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>