<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'

import CorridorScene from '@/components/background/CorridorScene.vue'
import { useArtworkQueryManager } from '@/stores/ArtworkQueryManager.ts'
import { useArtworkStore } from '@/stores/artworks.ts'
import { useRouter } from 'vue-router'
import { useSiteSettings } from '@/stores/siteSettings.ts'

const artworkStore = useArtworkStore()
const siteSettings = useSiteSettings()
const artworkManager = useArtworkQueryManager()

const router = useRouter()


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
    render-mode="on-demand"

  >
    <TresPerspectiveCamera :position="[0, 0, 0]" />
    <Suspense>
      <CorridorScene
        :artworks="artworkManager.searchArtworks.value"
        @replace-artwork="replaceArtwork"
        @clicked-artwork="explore"
      />
    </Suspense>
  </TresCanvas>
</template>

<style scoped>
.canvas-component {
  z-index: 3;
}
</style>
