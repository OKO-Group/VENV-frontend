<template>
  <v-navigation-drawer
    v-if="node"
    v-model="internalOpen"
    location="right"
    width="360"
    class="graph-sidebar"
    temporary
    :permanent="false"
    :scrim="false"
  >
    <v-container v-if="node" class="sidebar-content pa-5">
      <div class="text-center mb-6">
        <a
          :href="`https://instagram.com/${node.id}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          <v-avatar :image="node.avatar" size="123" class="elevation-3" />
        </a>
        <h3 class="mt-4 mb-1 text-h6 font-weight-medium text-white">{{ node.name }}</h3>
        <a
          :href="`https://instagram.com/${node.id}`"
          target="_blank"
          rel="noopener noreferrer"
        >
        <p class="text-caption text-grey-lighten-1">@{{ node.id }}</p>
        </a>
        <p v-if="node.type" class="text-white mb-1">
          {{ node.type == 'org' ? 'Organization' : 'Individual' }}
        </p>
        <p class="text-caption text-grey-lighten-1">{{ node.bio || '~' }}</p>
      </div>

      <v-divider class="my-4" />

      <p class="text-white mb-1">
        <strong>Followers:</strong> {{ node.followers }}
      </p>



      <p v-if="node.links?.length" class="text-white mb-1">
        <a
          :href="node.links[0]"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-lighten-2"
        >
          {{ node.links[0] }}
        </a>
      </p>
      <a
        :href="`https://instagram.com/${node.id}`"
        target="_blank"
        rel="noopener noreferrer"
      >
      <div v-if="node.gallery?.length" class="gallery-scroll mt-3">
        <v-img
          v-for="img in node.gallery"
          :key="img"
          :src="img"
          class="gallery-img mr-3 rounded"
          cover
        />
      </div>
      </a>
    </v-container>
  </v-navigation-drawer>
</template>



<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  node: any
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

const internalOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})
</script>

<style scoped>

.gallery-img {
  height: 200px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 8px;
}
.sidebar-content {
  overflow-y: auto;
  max-height: 100%;
}
.graph-sidebar {
  z-index: 20;
  height: 100% !important;
  background-color: #121212 !important;
}
.gallery-scroll {
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;
}
.gallery-scroll::-webkit-scrollbar {
  height: 6px;
}
.gallery-scroll::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}
.gallery-scroll::-webkit-scrollbar-track {
  background: transparent;
}



</style>
