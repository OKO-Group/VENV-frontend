<script setup lang="ts">
import {
  mdiArrowDown,
  mdiArrowUp,
  mdiEyeOutline,
  mdiFormatListBulleted,
  mdiMagnify,
  mdiPlusCircle, mdiPlusCircleOutline,
  mdiViewAgenda,
  mdiViewGrid
} from '@mdi/js'
import ArtworkListRenderer from './ArtworkListRenderer.vue'
import { computed, nextTick, ref } from 'vue'
import orderBy from 'lodash-es/orderBy'
import { isMobile } from '@/utils/isMobile.ts'
import { useArtworkStore } from '@/stores/artworks.ts'


const props = defineProps<{
  showUpload?: boolean
  useOwnArtworks?: boolean
  artworks: any[]
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<any>
  hasNextPage: boolean
  selectedArtwork: any
  artworkStore: any
}>()


const viewModes = [
  { value: 'relaxed', icon: mdiViewAgenda, title: 'Relaxed' },
  { value: 'compact', icon: mdiFormatListBulleted, title: 'Compact' },
  { value: 'grid', icon: mdiViewGrid, title: 'Grid' }
] as const

type ViewMode = (typeof viewModes)[number]['value']
const selectedViewMode = ref<ViewMode>(isMobile ? 'grid' : 'relaxed')

defineEmits([
  'selectArtwork',
  'upload'
])


const artworkStore = useArtworkStore()
const searchInput = ref<HTMLInputElement | null>(null)
const searchActive = ref(false)
const searchHiding = ref(false)

const activateSearch = () => {
  searchActive.value = true
  nextTick(() => {
    searchInput.value?.focus?.()
  })
}

const handleBlur = () => {
  if (!artworkStore.searchOwn) {
    searchHiding.value = true
    searchActive.value = false
  }
}

import { onClickOutside } from '@vueuse/core'

const searchFieldRef = ref(null)

onClickOutside(searchFieldRef, () => {
  if (!artworkStore.searchOwn) searchActive.value = false
})

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
  return orderBy(props.artworks, sortBy.value === 'title' ? ['title'] : ['uploaded_at'], [
    sortDirection.value
  ])
})
</script>

<template>
  <v-card class="d-flex flex-column search-panel" variant="flat"
          :height="isMobile? '75vh' : '78vh'">
    <v-row
      class="list-controls align-center"
      align="center"
      justify="space-between"
      style="margin-top: 3px; margin-bottom: 3px"
      no-gutters
    >
      <!-- Upload Button -->
      <v-col v-if="useOwnArtworks"
             class="justify-center" style="max-width: 60px">
        <v-btn v-if="showUpload" @click="$emit('upload')" icon>
          <v-icon :icon="mdiPlusCircle" size="33" />
        </v-btn>
      </v-col>
      <!-- Search Button + Expanding Field -->
      <v-col v-if="useOwnArtworks"
             class="d-flex align-center" style="max-width: 300px">
        <v-tooltip v-if="!searchActive" text="Search" location="top">
          <template #activator="{ props }">
            <div
              v-bind="props"
              class="search-icon-wrapper"
              @click="activateSearch"
              v-show="!searchActive && !searchHiding"
            >
              <v-icon :icon="mdiMagnify" />
            </div>
          </template>
        </v-tooltip>

        <transition
          name="fade-expand"
          @after-leave="searchHiding = false"

        >
          <div ref="searchFieldRef" v-if="searchActive"
               class="expanded-search-wrapper d-flex align-center">
            <v-text-field
              ref="searchInput"
              v-model="artworkStore.searchOwn"
              label="Search"
              variant="solo"
              density="compact"
              :append-inner-icon="mdiMagnify"
              class="expanded-search"
              @blur="handleBlur"
            />
          </div>
        </transition>
      </v-col>


      <!-- View Mode Toggle -->
      <v-col
        class="d-flex justify-end"
        v-if="!isMobile"
      >
        <v-btn-toggle
          density="compact"
          v-model="selectedViewMode"
          mandatory
        >
          <v-btn
            v-for="mode in viewModes"
            :key="mode.value"
            :value="mode.value"
            :title="mode.title"
            icon
            variant="outlined"
          >
            <v-icon :icon="mode.icon" />
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-row
      v-if="selectedViewMode !== 'grid'"
      class="font-weight-medium text-caption grey text-center"
      style="width: 99%; max-height: 60px; min-height: 60px"
    >
      <v-col cols="1">#</v-col>
      <v-col cols="3" class="cursor-pointer text-left" @click="toggleSort('title')">
        Title
        <v-icon small>
          {{ sortBy === 'title' ? (sortDirection === 'asc' ? mdiArrowUp : mdiArrowDown) : '' }}
        </v-icon>
      </v-col>
      <v-col cols="5" style="padding-right: 33px">Artwork</v-col>
      <v-col
        cols="3"
        class="cursor-pointer text-end"
        style="padding-right: 0"
        @click="toggleSort('date')"
      >
        Date
        <v-icon small>
          {{ sortBy === 'date' ? (sortDirection === 'asc' ? mdiArrowUp : mdiArrowDown) : '' }}
        </v-icon>
      </v-col>
    </v-row>
    <ArtworkListRenderer
      :artworks="filteredArtworks"
      :viewMode="selectedViewMode"
      :selectedArtworkId="selectedArtwork?.id"
      :useOwnArtworks="useOwnArtworks"
      :fetch-next-page="fetchNextPage"
      :is-fetching-next="isFetchingNextPage"
      :has-next-page="hasNextPage"
      @select="$emit('selectArtwork', $event)"
    />
  </v-card>
</template>

<style scoped>

.list-controls {
  position: sticky;
}

.search-panel {
  background-color: rgba(0, 0, 0, 0) !important;
  backdrop-filter: none !important; /* Adds a nice frosted-glass effect */
}

.search-icon-wrapper {
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
  width: 300px;
  transition: all 0.5s ease !important;
}

.cursor-pointer {
  cursor: pointer;
}

.expanded-search-wrapper {
  width: 300px;
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: width 0.4s ease, opacity 0.3s ease;
  overflow: hidden;
  display: inline-block;
}

.fade-expand-enter-from,
.fade-expand-leave-to {
  width: 0;
  opacity: 0;
}

.fade-expand-enter-to,
.fade-expand-leave-from {
  width: 300px;
  opacity: 1;
}


</style>
