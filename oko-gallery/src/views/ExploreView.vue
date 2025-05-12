<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useArtworkStore } from '@/stores/artworks.ts'
import { useDebounceFn, useMediaQuery } from '@vueuse/core'
import type { Artwork } from '@/types/oko.ts'
import { fallbackArtworks } from '@/assets/fallbackArtworks.ts'
import { useArtworkQueryManager } from '@/stores/ArtworkQueryManager.ts'
import { isMobile } from '@/utils/isMobile.ts'

const artworkStore = useArtworkStore()
const artworkManager = useArtworkQueryManager()

const query = computed(() => ({ field_set: 'full', painting: '1' }))

const { data } = artworkManager.query(query)

function hasImage(artwork: Artwork): boolean {
  return !!artwork.files.find((f) => f.category === 'painting')
}

const updateArtworks = useDebounceFn((newData) => {
  if (newData?.pages) {
    artworkManager.searchArtworks.value =
      data.value?.pages
        .flatMap((page) => page.results)
        .filter((a) => a.files.length > 0 && hasImage(a)) ?? []
  }
}, 150) // debounce delay in ms

watch(
  () => data.value,
  (newVal) => {
    if (newVal) {
      updateArtworks(newVal)
    } else {
      // fallback
      artworkManager.searchArtworks.value = fallbackArtworks
    }
  }, {immediate: true}
)

onMounted(() => {
  // If there's no redirection, assume user clicked RouterLink or typed URL manually
  if (artworkStore.isCameraFree) {
    artworkStore.cameraPos = [0, 1.8, isMobile ? 13.3: 6]
  }
  artworkStore.isCameraFree = true
})
onUnmounted(() => {
  artworkStore.cameraPos = [0, 1.8, 20]
})
</script>

<template></template>

<style scoped>
.canvas-component {
  z-index: 1;
}
</style>
