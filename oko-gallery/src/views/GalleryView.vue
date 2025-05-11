<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'

import CorridorScene from '@/components/background/CorridorScene.vue'
import { useArtworkQueryManager } from '@/stores/ArtworkQueryManager.ts'
import type { Artwork } from '@/types/oko.ts'
import { useDebounceFn } from '@vueuse/core'
import { computed, watch } from 'vue'
import { useArtworkStore } from '@/stores/artworks.ts'
import { useRouter } from 'vue-router'
import { fallbackArtworks } from '@/assets/fallbackArtworks.ts'

const query = computed(() => ({ field_set: 'full', painting: '1' }))

const artworkStore = useArtworkStore()
const artworkManager = useArtworkQueryManager()

const router = useRouter()
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
      console.log('falling back')
      artworkManager.searchArtworks.value = fallbackArtworks
    }
  },
  { immediate: true },
)

const explore = () => {
  if (router.currentRoute.value.fullPath !== '/explore') {
    artworkStore.isCameraFree = false
    router.push({ path: '/explore' })
  }
}

function replaceArtwork(id: number) {
  artworkManager.replaceArtwork(id)
}
</script>

<template>
  <TresCanvas
    v-if="artworkManager.searchArtworks.value"
    window-size
    preset="realistic"
    class="canvas-component"
  >
    <TresPerspectiveCamera :position="[0, 0, 0]" />
    <CorridorScene
      :artworks="artworkManager.searchArtworks.value"
      @replace-artwork="replaceArtwork"
      @clicked-artwork="explore"
    />
  </TresCanvas>
</template>

<style scoped>
.canvas-component {
  z-index: 3;
}
</style>
