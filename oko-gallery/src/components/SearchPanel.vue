<script setup lang="ts">
import {
  mdiMagnify,
  mdiPlusCircle,
  mdiArrowUp,
  mdiArrowDown,
  mdiEyeOutline,
  mdiViewAgenda, mdiFormatListBulleted, mdiViewGrid
} from '@mdi/js'
import ArtworkListRenderer from './ArtworkListRenderer.vue'
import { computed, ref } from 'vue'
import orderBy from 'lodash-es/orderBy'
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  showUpload?: boolean,
  useOwnArtworks?: boolean,
  searchActive: boolean,
  artworks: any[],
  isFetchingNextPage: boolean,
  fetchNextPage: () => Promise<any>,
  hasNextPage: boolean,
  selectedArtwork: any,
  artworkStore: any,
}>()

const isMobile = useMediaQuery('(max-width: 768px)')


const viewModes = [
  { value: 'relaxed', icon: mdiViewAgenda, title: 'Relaxed' },
  { value: 'compact', icon: mdiFormatListBulleted, title: 'Compact' },
  { value: 'grid', icon: mdiViewGrid, title: 'Grid' }
] as const

type ViewMode = typeof viewModes[number]['value']
const selectedViewMode = ref<ViewMode>(isMobile ? 'grid' : 'relaxed')

const emit = defineEmits(['update:viewMode', 'selectArtwork', 'toggleSort', 'upload', 'blur', 'activateSearch'])

const sortBy = ref<'date' | 'title'>('date')

const sortDirection = ref<'asc' | 'desc'>('desc')
const loadedArtworks = ref(false)
function toggleSort(field: 'date' | 'title') {
  if (sortBy.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortDirection.value = 'asc'
  }
}

// Client-side filtering and sorting
const filteredArtworks = computed(() => {
  if (!props.artworks.length) return []

  loadedArtworks.value = true
  return orderBy(props.artworks,
    sortBy.value === 'title' ? ['title'] : ['uploaded_at'],
    [sortDirection.value])
})

</script>

<template>
  <v-card class="pa-4 d-flex flex-column" height="75vh">
    <div v-if="useOwnArtworks" class="pa-2 pt-10 pb-10 search-bar-wrapper">
      <v-tooltip v-if="!searchActive" text="Search" location="top">
        <template #activator="{ props }">
          <div v-bind="props" class="search-icon-wrapper" @click="$emit('activateSearch')">
            <v-icon v-if="!searchActive" :icon="mdiMagnify" />
          </div>
        </template>
      </v-tooltip>

      <transition name="fade-expand">
        <v-text-field
          v-if="searchActive"
          v-model="artworkStore.searchOwn"
          label="Search artworks..."
          variant="outlined"
          density="compact"
          :prepend-inner-icon="mdiMagnify"
          class="expanded-search"
          @blur="$emit('blur')"
        />
      </transition>
    </div>

    <v-btn
      v-if="showUpload"
      icon
      color="black"
      class="mb-4 mx-auto"
      @click="$emit('upload')"
    >
      <v-icon :icon="mdiPlusCircle" />
    </v-btn>

    <div class="d-flex justify-space-between align-center mb-2">
      <v-btn-toggle v-if="!isMobile" density="compact" v-model="selectedViewMode" class="mb-2"
                    mandatory>
        <v-btn
          variant="outlined"
          v-for="mode in viewModes"
          :key="mode.value"
          :value="mode.value"
          :title="mode.title"
          icon>
          <v-icon :icon="mode.icon" />
        </v-btn>
      </v-btn-toggle>
    </div>

    <v-row v-if="selectedViewMode !== 'grid'"
           class="px-2 py-1 font-weight-medium text-caption grey text-center"
           style="width: 99%; max-height: 60px; min-height: 60px">
      <v-col cols="1">#</v-col>
      <v-col cols="3" class="cursor-pointer text-left" @click="toggleSort('title')">
        Title
        <v-icon small>
          {{ sortBy === 'title' ? (sortDirection === 'asc' ? mdiArrowUp : mdiArrowDown) : '' }}
        </v-icon>
      </v-col>
      <v-col cols="4">Artwork</v-col>
      <v-col cols="4" class="cursor-pointer text-end" style="padding-right: 25px"
             @click="toggleSort('date')">
        Date
        <v-icon small>
          {{ sortBy === 'date' ? (sortDirection === 'asc' ? mdiArrowUp : mdiArrowDown) : '' }}
        </v-icon>
      </v-col>
    </v-row>
    <ArtworkListRenderer
      v-if="filteredArtworks.length"
      :artworks="filteredArtworks"
      :viewMode="selectedViewMode"
      :selectedArtworkId="selectedArtwork?.id"
      :useOwnArtworks="useOwnArtworks"
      :fetch-next-page="fetchNextPage"
      :has-next-page="hasNextPage"
      @select="$emit('selectArtwork', $event)"
    />
    <v-else>
      <v-row class="text-center">
        <v-col>
          <v-progress-circular v-if="!filteredArtworks.length" indeterminate/>
        </v-col>
      </v-row>
    </v-else>
    <div class="text-center mt-4">
      <v-progress-circular v-if="isFetchingNextPage" indeterminate />
      <v-icon v-else-if="!hasNextPage && filteredArtworks.length"> {{ mdiEyeOutline }}</v-icon>
    </div>
  </v-card>
</template>

<style scoped>

.search-bar-wrapper {
  height: 50px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
}

.search-icon-wrapper {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}


.search-icon-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.expanded-search {
  width: 240px;
  transition: all 0.3s ease;
}

.cursor-pointer {
  cursor: pointer;
}


</style>
