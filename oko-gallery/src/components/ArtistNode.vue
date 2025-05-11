<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import { Position } from '@vue-flow/core'
import type { ArtistNodeData } from '@/utils/generate_artist_graph.ts'
import { mdiEyeOutline } from '@mdi/js'


const props = defineProps<NodeProps<ArtistNodeData>>()

</script>


<template>
  <div class="artist-node">
      <img v-if="data.thumbnail" :src="data.thumbnail" alt="Avatar" class="avatar" />
    <v-avatar v-else :icon="mdiEyeOutline"> </v-avatar>
  </div>
</template>


<style scoped>
.artist-node {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  background-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

</style>
