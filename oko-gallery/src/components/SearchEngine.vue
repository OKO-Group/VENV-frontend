<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, unref, watch } from 'vue'
import { useDebounce, useDebounceFn, watchDebounced } from '@vueuse/core'
import { useArtworkStore } from '@/stores/artworks'
import {
  mdiArrowDown,
  mdiArrowUp,
  mdiEyeOutline,
  mdiFilter,
  mdiFormatListBulleted,
  mdiMagnify,
  mdiPlusCircle,
  mdiViewAgenda,
  mdiViewGrid
} from '@mdi/js'
import { type Artwork, type ArtworkSearchQuery, type PaginatedResponse } from '@/types/oko'
import { useAuthStore } from '@/stores/auth.ts'
import { useArtworksInfinite } from '@/stores/useArtworkQuery.ts'
import { chain } from 'lodash-es'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import filterdb from '@/assets/filters.json'
import ArtworkPanel from '@/components/ArtworkPanel.vue'
import { type InfiniteData, useQueryClient } from '@tanstack/vue-query'
import ArtworkListRenderer from '@/components/ArtworkListRenderer.vue'
import { useRoute, useRouter } from 'vue-router'



const props = defineProps<{
  showUpload?: boolean;
  enableUserFilter?: boolean;
  useOwnArtworks?: boolean;
}>()


const route = useRoute()
const router = useRouter()

const artworkStore = useArtworkStore()
const authStore = useAuthStore()

const sortBy = ref<'date' | 'title'>('date')
let selectedArtwork = ref<Artwork | null>(null)


const filters = ref({
  style: [] as string[],
  genre: [] as string[],
  media: [] as string[],
  user: null as number | null
})

const viewModes = [
  { value: 'relaxed', icon: mdiViewAgenda, title: 'Relaxed' },
  { value: 'compact', icon: mdiFormatListBulleted, title: 'Compact' },
  { value: 'grid', icon: mdiViewGrid, title: 'Grid' }
] as const

type ViewMode = typeof viewModes[number]['value']
const selectedViewMode = ref<ViewMode>('relaxed')

const allArtworks = shallowRef<Artwork[]>([])


const sortDirection = ref<'asc' | 'desc'>('desc')

const queryUserId = computed(() => {
  return props.useOwnArtworks ? authStore.user?.id : (props.enableUserFilter ? filters.value.user : null)
})

const querySource = computed(() => {
  return props.useOwnArtworks ? artworkStore.searchOwn : artworkStore.search
})

onMounted(() => {
  if (props.enableUserFilter) {
    artworkStore.getArtists()
  }
})


const computedQuery = useDebounce(computed<ArtworkSearchQuery>(() => ({
  q: querySource.value,
  style: filters.value.style.length ? filters.value.style.join(',') : null,
  genre: filters.value.genre.length ? filters.value.genre.join(',') : null,
  media: filters.value.media.length ? filters.value.media.join(',') : null,
  user: queryUserId.value || null,
  field_set: 'full'
})), 700) // debounce query object by 700ms

onMounted(() => {
  const q = route.query
  filters.value = {
    style: typeof q.style === 'string' ? q.style.split(',') : [],
    genre: typeof q.genre === 'string' ? q.genre.split(',') : [],
    media: typeof q.media === 'string' ? q.media.split(',') : [],
    user: q.user ? Number(q.user) : null,
  }

  // also update the search string
  const search = q.q
  if (typeof search === 'string') {
    artworkStore.search = search
  }
})

function updateQueryParams() {
  const query: Record<string, any> = {}
  if (artworkStore.search) query.q = artworkStore.search
  if (filters.value.style.length) query.style = filters.value.style.join(',')
  if (filters.value.genre.length) query.genre = filters.value.genre.join(',')
  if (filters.value.media.length) query.media = filters.value.media.join(',')
  if (filters.value.user) query.user = filters.value.user

  router.replace({ path: '/search', query })
}

watchDebounced(
  [() => artworkStore.search, () => filters.value],
  updateQueryParams,
  { debounce: 500, deep: true }
)

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useArtworksInfinite(computedQuery)


const updateArtworks = useDebounceFn((newData) => {
  if (newData?.pages) {
    allArtworks.value = newData.pages.flatMap(page => page.results)
  }
}, 500) // debounce delay in ms

watch(
  () => data.value,
  (newVal) => {
    updateArtworks(newVal)
  }
)

function selectArtwork(item: Artwork) {
  if (selectedArtwork.value?.id === item.id) return
  isCreatingNew.value = false
  selectedArtwork.value = item
}

// Client-side filtering and sorting
const filteredArtworks = computed(() => {
  if (!allArtworks.value.length) return []
  return chain(allArtworks.value)
    .filter(a => {
      const { style, genre, media, user } = filters.value
      const matchesStyle = !style.length || style.includes(a.style)
      const matchesGenre = !genre.length || genre.includes(a.genre)
      const matchesMedia = !media.length || media.includes(a.media)
      const matchesUser = !props.enableUserFilter || user === null || a.user.id === user
      return matchesStyle && matchesGenre && matchesMedia && matchesUser
    })
    .orderBy(
      sortBy.value === 'title' ? ['title'] : ['uploaded_at'],
      [sortDirection.value]
    )
    .value()
})

function toggleSort(field: 'date' | 'title') {
  if (sortBy.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortDirection.value = 'asc'
  }
}


const isCreatingNew = shallowRef(false)

const initArtworkCanvas = () => {
  if (!artworkStore.artworkDraft && authStore.user) {
    artworkStore.resetArtworkDraft(authStore.user)
  }
  selectedArtwork.value = artworkStore.artworkDraft
  isCreatingNew.value = true
}


const searchActive = ref(false)
const hovering = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

const activateSearch = () => {
  searchActive.value = true
  nextTick(() => {
    searchInput.value?.focus?.()
  })
}

const handleBlur = () => {
  if (!artworkStore.searchOwn) {
    searchActive.value = false

  }
}

const queryClient = useQueryClient()

function handleArtworkUpdate(updated: Artwork) {
  queryClient.setQueryData<InfiniteData<PaginatedResponse<Artwork>>>(
    ['artworks', unref(computedQuery)],
    (oldData) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          results: page.results.map((a) =>
            a.id === updated.id ? updated : a
          )
        }))
      }
    }
  )
  selectedArtwork.value = updated
}

function handleArtworkUpload(uploaded: Artwork) {
  queryClient.setQueryData<InfiniteData<PaginatedResponse<Artwork>>>(['artworks', computedQuery], (oldData) => {
    if (!oldData) return oldData
    // Optional: Decide where to insert the new artwork. Here: prepend to page 1
    const firstPage = oldData.pages[0]
    const newFirstPage = {
      ...firstPage,
      results: [uploaded, ...firstPage.results]
    }
    return {
      ...oldData,
      pages: [newFirstPage, ...oldData.pages.slice(1)]
    }
  })
  selectedArtwork.value = uploaded
  isCreatingNew.value = false
}

function handleArtworkDelete() {
  queryClient.setQueryData<InfiniteData<PaginatedResponse<Artwork>>>(
    ['artworks', unref(computedQuery)],
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          results: page.results.filter((a) => a.id !== selectedArtwork.value?.id)
        }))
      }
    }
  )

  selectedArtwork.value = null
}


</script>

<template>
  <v-row>
    <!-- Left: Filters -->
    <v-col cols="2" class="pr-4">
      <v-card class="pa-4 d-flex flex-column align-center">
        <v-spacer class="mb-3"></v-spacer>
        <v-icon class="mb-4">{{ mdiFilter }}</v-icon>

        <v-autocomplete
          v-model="filters.style"
          :items="filterdb.styles"
          item-title="label"
          item-value="value"
          multiple
          chips
          closable-chips
          label="Style"
          variant="outlined"
          density="compact"
          class="mb-4"
          style="width: 100%;"
        />

        <v-autocomplete
          v-model="filters.genre"
          :items="filterdb.genres"
          item-title="label"
          item-value="value"
          multiple
          chips
          closable-chips
          label="Genre"
          variant="outlined"
          density="compact"
          class="mb-4"
          style="width: 100%;"
        />

        <v-autocomplete
          v-model="filters.media"
          :items="filterdb.media"
          item-title="label"
          item-value="value"
          multiple
          chips
          closable-chips
          label="Media"
          variant="outlined"
          density="compact"
          style="width: 100%;"
        />

        <v-autocomplete
          v-if="props.enableUserFilter"
          v-model="filters.user"
          :items="artworkStore.artists"
          :item-title="(item) => `${item.first_name} ${item.last_name}`"
          item-value="id"
          label="Artist"
          variant="outlined"
          density="compact"
          class="mt-4"
          style="width: 100%;"
        />
      </v-card>

    </v-col>

    <!-- Left Panel -->
    <v-col cols="6">
      <v-card class="pa-4 d-flex flex-column" height="80vh">
        <!-- Filters, search bar, upload button remain unchanged -->
        <!-- Wrap the search input outside of scrollable area OR make its container non-flex shrinking -->
        <div v-if="useOwnArtworks" class="pa-2 pt-10 pb-10 search-bar-wrapper">
          <v-tooltip v-if="!searchActive" text="Search" location="top">
            <template #activator="{ props }">
              <div
                v-bind="props"
                class="search-icon-wrapper"
                @click="activateSearch"
                @mouseenter="hovering = true"
                @mouseleave="hovering = false"
              >
                <v-icon v-if="!searchActive" :icon="mdiMagnify" />
              </div>
            </template>
          </v-tooltip>

          <transition name="fade-expand">
            <v-text-field
              v-if="searchActive"
              v-model="artworkStore.searchOwn"
              ref="searchInput"
              label="Search artworks..."
              variant="outlined"
              density="compact"
              :prepend-inner-icon="mdiMagnify"
              class="expanded-search"
              @blur="handleBlur"
            />
          </transition>
        </div>


        <v-btn
          v-if="props.showUpload"
          icon
          color="black"
          class="mb-4 mx-auto"
          @click="initArtworkCanvas"
        >
          <v-icon :icon="mdiPlusCircle" />
        </v-btn>
        <!-- View Switch + Sort Headers -->
        <div class="d-flex justify-space-between align-center mb-2">
          <v-btn-toggle density="compact" v-model="selectedViewMode" class="mb-2" mandatory>
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


        <!-- Column Headers (only for relaxed/compact) -->
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
          :artworks="filteredArtworks"
          :viewMode="selectedViewMode"
          :selectedArtworkId="selectedArtwork?.id"
          :useOwnArtworks="props.useOwnArtworks"
          :fetch-next-page="fetchNextPage"
          :has-next-page="hasNextPage"
          @select="selectArtwork"
        />
        <div class="text-center mt-4">
          <v-progress-circular v-if="isFetchingNextPage" indeterminate />
          <v-icon v-else-if="!hasNextPage"> {{ mdiEyeOutline }}</v-icon>
        </div>
      </v-card>
    </v-col>
    <!-- Right Panel (only shown if artwork selected) -->
    <ArtworkPanel
      v-if="selectedArtwork"
      :artwork="selectedArtwork"
      :is-creating-new="isCreatingNew"
      :filterdb="filterdb"
      @update-artwork="handleArtworkUpdate"
      @upload-artwork="handleArtworkUpload"
      @delete-artwork="handleArtworkDelete"
    />
  </v-row>
</template>


<style scoped>

.filter-row > * {
  min-width: 120px;
}

::-webkit-scrollbar {
  width: 8px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #e1dbdb;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: rgb(164, 164, 164);
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.cursor-pointer {
  cursor: pointer;
}

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


</style>
