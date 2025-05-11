<script setup lang="ts">
import { VueFlow, type GraphNode, type GraphEdge } from '@vue-flow/core'
import ArtistNode from '@/components/ArtistNode.vue'
import { generateArtistGraph, useLayout } from '@/utils/generate_artist_graph.ts'
import { computed, markRaw, nextTick, onMounted, ref } from 'vue'
import { useArtworkStore } from '@/stores/artworks'
import type { User } from '@/types/oko.ts'
import { Background } from '@vue-flow/background'
import StandardPage from '@/components/main/StandardPage.vue'
import { mdiEyeOutline, mdiLinkVariant, mdiMapMarker } from '@mdi/js'

const artworkStore = useArtworkStore()
const nodes = ref<GraphNode<User>[]>([])
const edges = ref<any>([])

const hoveredUser = ref(null)
const hoverPosition = ref({ x: 0, y: 0 })

const { layout } = useLayout()
onMounted(async () => {
  await artworkStore.getArtists(true)

  const { nodes: rawNodes, edges: rawEdges } = generateArtistGraph(artworkStore.artists_graph)

  // Apply dagre layout
  await nextTick(() => {
    nodes.value = layout(rawNodes as GraphNode[], rawEdges as GraphEdge[], 'TB')
    edges.value = rawEdges
  })
})

const clickedUser = ref<User | null>(null)
const dialogOpen = computed({
  get: () => clickedUser.value !== null,
  set: (val) => {
    if (!val) clickedUser.value = null
  }
})

</script>

<template>
  <StandardPage>
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      class="artist-graph"
      :node-types="{ artistNode: markRaw(ArtistNode)}"
      :default-viewport="{ x: 0, y: 0, zoom: 1}"
      :edges-updatable="false"
      :connectable="false"
      :zoom-on-double-click="false"
      :style="{ background: 'rgba(240,240,240,0)' }"

      @node-click="({ node }) => clickedUser = node.data"
      @node-mouse-enter="({ event , node }) => {
        hoveredUser = node.data;
        hoverPosition = { x: node.position.x, y: node.position.y}
      }"
      @node-mouse-leave="() => hoveredUser = null"

    >
      <Background bg-color="rgba(240,240,240,0.21)" />
    </VueFlow>

    <!-- Hover Card -->
    <div
      v-if="hoveredUser"
      class="hover-card"
      :style="{ top: `${hoverPosition.y + 10}px`, left: `${hoverPosition.x + 10}px` }"
    >
      <strong>{{ hoveredUser.first_name }} {{ hoveredUser.last_name }}</strong><br />
      <span class="text-caption">{{ hoveredUser.email }}</span><br />
      <a :href="hoveredUser.portfolio_link" class="text-caption" target="_blank">
        {{ hoveredUser.portfolio_link }}
      </a>
    </div>

    <!-- Clicked Artist Dialog -->
    <v-dialog v-model="dialogOpen" max-width="480" transition="fade-transition">
      <v-card v-if="clickedUser" class="user-card elevation-10 pa-4" style="border-radius: 16px;">
        <v-card-text class="text-center">
          <!-- Avatar or fallback icon -->
          <div class="d-flex justify-center mb-4">
            <v-avatar size="170" class="elevation-3">
              <v-img
                v-if="clickedUser.profile_picture?.file_thumbnail"
                :src="clickedUser.profile_picture.file_thumbnail"
                cover
              />
              <v-icon
                v-else
                :icon="mdiEyeOutline"
                size="56"
                color="grey"
                class="ma-auto"
              />
            </v-avatar>
          </div>

          <!-- Full name -->
          <h2 class="text-h6 font-weight-medium mb-2">
            {{ clickedUser.first_name }} {{ clickedUser.last_name }}
          </h2>

          <!-- Username and Email -->
          <div class="text-body-2 grey--text mb-3">
            @{{ clickedUser.username }} ·
            <a target="_blank" :href="`mailto:${clickedUser.email}`">{{ clickedUser.email }}</a>
          </div>

          <v-divider class="my-3" />
          <!-- Portfolio -->
          <div v-if="clickedUser.portfolio_link" class="mb-2">
            <v-icon small class="mr-1" :icon="mdiLinkVariant" />
            <a
              :href="clickedUser.portfolio_link"
              target="_blank"
              class="text-decoration-none font-weight-medium"
            >
              Portfolio
            </a>
          </div>
          <!-- Location -->
          <div v-if="clickedUser.location" class="mb-2">
            <v-icon small class="mr-1" :icon="mdiMapMarker" />
            {{ clickedUser.location }}
          </div>

          <!-- Biography -->
          <div v-if="clickedUser.biography" class="mt-3 text-left">
            <p class="text-caption font-italic" style="white-space: pre-wrap;">
              “{{ clickedUser.biography }}”
            </p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

  </StandardPage>
</template>

<style scoped>
.artist-graph {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;


  border: 1px solid rgba(0, 0, 0, 0.1);
  box-sizing: border-box;

  border-radius: 1px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.user-card {
  background-color: rgba(141, 141, 141, 0.47) !important;
}

.hover-card {
  position: fixed;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}
</style>
