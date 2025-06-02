<script setup lang="ts">
import { computed, onBeforeMount, onMounted, onUnmounted, type Ref, ref, watch } from 'vue'
import { useArtworkStore } from '@/stores/artworks.ts'
import { useDebounceFn } from '@vueuse/core'
import type { Artwork } from '@/types/oko.ts'
import { fallbackArtworks } from '@/assets/fallbackArtworks.ts'
import { useArtworkQueryManager } from '@/stores/ArtworkQueryManager.ts'
import { isMobile } from '@/utils/isMobile.ts'
import SocialGraph from '@/components/SocialGraph.vue'
import { mdiAccountGroup, mdiInformation } from '@mdi/js'
import { useSiteSettings } from '@/stores/siteSettings.ts'

const siteSettings = useSiteSettings()
const artworkStore = useArtworkStore()
const artworkManager = useArtworkQueryManager()

const exploreToggle = ref<'sgraph' | 'media'>('sgraph')

const query = computed(() => ({ field_set: 'full', painting: '1' }))
// Load json file with nodes and edges from public folder
const venvSocialGraph = ref(null)

onMounted(async () => {
  const module = await import('venv/public/venv_social_graph.json')
  venvSocialGraph.value = module.default
  // console.log('Social graph data loaded:', venvSocialGraph.value)
})
let data: null | ReturnType<typeof artworkManager.query> = null
watch(exploreToggle, () => (data = artworkManager.query(query)))

function hasImage(artwork: Artwork): boolean {
  return !!artwork.files.find((f) => f.category === 'painting')
}

const updateArtworks = useDebounceFn((newData) => {
  if (newData?.pages) {
    artworkManager.searchArtworks.value =
      data?.value?.pages
        .flatMap((page) => page.results)
        .filter((a) => a.files.length > 0 && hasImage(a)) ?? []
  }
}, 150) // debounce delay in ms

watch(
  () => data?.value,
  (newVal) => {
    if (newVal) {
      updateArtworks(newVal)
    } else {
      // fallback
      artworkManager.searchArtworks.value = fallbackArtworks
    }
  },
  { immediate: true },
)

onMounted(() => {
  // If there's no redirection, assume user clicked RouterLink or typed URL manually
  if (artworkStore.isCameraFree) {
    artworkStore.cameraPos = [0, 1.8, isMobile ? 13.3 : 6]
  }
  artworkStore.isCameraFree = true
})

onUnmounted(() => {
  artworkStore.cameraPos = [0, 1.8, 20]
})

const isOpen = ref(false)

onBeforeMount(() => {
  const hasSeenIntro = localStorage.getItem('venv_explore_info_shown')
  const isFirstVisit = !hasSeenIntro

  if (isFirstVisit) {
    isOpen.value = true
    localStorage.setItem('venv_explore_info_shown', 'true')
  }
})
</script>

<template>
  <div v-if="siteSettings.mode != 'dune'" class="graph-container">
    <v-dialog v-model="isOpen" transition="slide-y-transition" width="auto" @click="isOpen = false">
      <v-card style="position: relative; max-width: 1000px" variant="flat">
        <v-card-text class="text-center">
          <h1 class="text-h5 font-weight-bold mb-2">
            <v-icon
              :icon="mdiAccountGroup"
              size="small"
              class="mx-1"
              style="vertical-align: middle"
            />
          </h1>
          <p class="text-body-1 mb-4">
            This graph displays the IG community graph spanning from VENV.co to FOF
            (friends-of-friends). We derive no monetary gain from this graph and no rights for any
            of the content displayed here. Only creators & organizations minimalist public data is
            shown. If you want to have your node removed, please contact us. Read About
            <v-icon
              :icon="mdiInformation"
              size="small"
              class="mx-1"
              style="vertical-align: middle"
            />
            page for more information.
          </p>
          <v-btn @click="isOpen = false">OK</v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
    <SocialGraph v-if="venvSocialGraph" :graph-data="venvSocialGraph" />
  </div>
</template>

<style scoped>
.graph-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #121212;
}

.cytoscape-container {
  width: 100%;
  height: 100%;
}
</style>
