<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useArtworkStore } from '@/stores/artworks.ts'
import { useDebounceFn } from '@vueuse/core'

const artworkStore = useArtworkStore()

onMounted(() => {
  // If there's no redirection, assume user clicked RouterLink or typed URL manually
  if (artworkStore.isCameraFree) {
    artworkStore.cameraPos = [0, 1.8, 6]
  }
  artworkStore.isCameraFree = true
})
onUnmounted(() => {
  artworkStore.cameraPos = [0, 1.8, 20]
})
</script>

<template>
</template>

<style scoped>
.canvas-component {
  z-index: 1;
}
</style>
