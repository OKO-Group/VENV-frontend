<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeMount,
  onMounted,
  ref,
  shallowRef, useTemplateRef,
  watch,
  watchEffect
} from 'vue'
import {
  useDebounce,
  useDebounceFn,
  useDraggable, useEventListener,
  useMediaQuery,
  watchDebounced
} from '@vueuse/core'
import { useArtworkStore } from '@/stores/artworks'
import { type Artwork, type ArtworkSearchQuery } from '@/types/oko'
import { useAuthStore } from '@/stores/auth.ts'
import filterdb from '@/assets/filters.json'
import ArtworkPanel from '@/components/ArtworkPanel.vue'
import { useRoute, useRouter } from 'vue-router'
import { useArtworkQueryManager } from '@/stores/ArtworkQueryManager.ts'
import SearchPanel from '@/components/SearchPanel.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import { fallbackArtworks } from '@/assets/fallbackArtworks.ts'
//TODO remove automatic fetching on search field change

const props = defineProps<{
  showUpload?: boolean;
  enableUserFilter?: boolean;
  useOwnArtworks?: boolean;
}>()


const route = useRoute()
const router = useRouter()

const artworkStore = useArtworkStore()
const authStore = useAuthStore()

let selectedArtwork = ref<Artwork | null>(null)


const filters = ref({
  style: [] as string[],
  genre: [] as string[],
  media: [] as string[],
  user: null as number | null
})

const allArtworks = shallowRef<Artwork[]>([])



const queryUserId = computed(() => {
  return props.useOwnArtworks ? authStore.user?.id : (props.enableUserFilter ? filters.value.user : null)
})

const querySource = computed(() => {
  return props.useOwnArtworks ? artworkStore.searchOwn : artworkStore.search
})

onMounted(() => {
  if (props.enableUserFilter && !props.useOwnArtworks) {
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


const artworkManager = useArtworkQueryManager()
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isFetching,
  refetch,
} = artworkManager.query(computedQuery)

const updateArtworks = useDebounceFn((newData) => {
  if (newData?.pages) {
    allArtworks.value = newData.pages.flatMap(page => page.results)
  }
}, 150) // debounce delay in ms

watchEffect( () => {
    if (data.value) {
      updateArtworks(data.value)
    } else if (!isFetching.value) {
      allArtworks.value = fallbackArtworks
    }
  }
)

onBeforeMount(() => {
  const q = route.query
  filters.value = {
    style: typeof q.style === 'string' ? q.style.split(',') : [],
    genre: typeof q.genre === 'string' ? q.genre.split(',') : [],
    media: typeof q.media === 'string' ? q.media.split(',') : [],
    user: q.user ? Number(q.user) : null
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

if (!props.useOwnArtworks) {
  watchDebounced(
    [() => artworkStore.search, () => filters.value],
    () => {
      updateQueryParams()
      selectedArtwork.value = null
    },
    { debounce: 500, deep: true }
  )
}

function selectArtwork(item: Artwork) {
  if (selectedArtwork.value?.id === item.id) return
  isCreatingNew.value = false
  selectedArtwork.value = item
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

function handleArtworkUpdate(updated: Artwork) {
  artworkManager.handleArtworkUpdate(updated)
  selectedArtwork.value = updated
}

function handleArtworkUpload(uploaded: Artwork) {
  artworkManager.handleArtworkUpload(uploaded)
  selectedArtwork.value = uploaded
  isCreatingNew.value = false
}

function handleArtworkDelete() {
  if (!selectedArtwork.value) return
  artworkManager.handleArtworkDelete(selectedArtwork.value?.id)
  selectedArtwork.value = null
}

const isMobile = useMediaQuery('(max-width: 768px)')


const artworkPanelRef = useTemplateRef<HTMLElement>('el')
const panelEl = ref<HTMLElement | null>(null)

const handleTap = (e: TouchEvent | MouseEvent) => {
  // Detect double tap via event.detail === 2
  if ((e as any).detail === 2) {
    selectedArtwork.value = null
  }
}

onMounted(() => {
  useEventListener(panelEl, 'click', handleTap, { passive: true })
})

</script>

<template>
  <v-container fluid>
    <!-- Mobile Layout: stacked vertically -->
    <div v-if="isMobile" >
      <v-col>
        <FilterPanel
          v-if="!selectedArtwork"
          :filters="filters"
          :filterdb="filterdb"
          :artists="artworkStore.artists"
          :enable-user-filter="enableUserFilter"
        />
        <SearchPanel
          v-if="!selectedArtwork"
          :artworks="allArtworks"
          :show-upload="showUpload"
          :use-own-artworks="useOwnArtworks"
          :search-active="searchActive"
          :is-fetching-next-page="isFetchingNextPage"
          :has-next-page="hasNextPage"
          :fetch-next-page="fetchNextPage"
          :selected-artwork="selectedArtwork"
          :artwork-store="artworkStore"
          @upload="initArtworkCanvas"
          @select-artwork="selectArtwork"
          @blur="handleBlur"
          @activate-search="activateSearch"
        />
          <ArtworkPanel
            v-if="selectedArtwork"
            ref="panelEl"
            :artwork="selectedArtwork"
            :is-creating-new="isCreatingNew"
            :filterdb="filterdb"
            @update-artwork="handleArtworkUpdate"
            @upload-artwork="handleArtworkUpload"
            @delete-artwork="handleArtworkDelete"
          />
      </v-col>

    </div>


    <!-- Desktop Layout: side-by-side -->
    <v-row v-else>
      <v-col cols="2" class="pr-4">
        <FilterPanel
          :filters="filters"
          :filterdb="filterdb"
          :artists="artworkStore.artists"
          :enable-user-filter="enableUserFilter"
        />
      </v-col>

      <v-col cols="6">
        <SearchPanel
          :artworks="allArtworks"
          :show-upload="showUpload"
          :use-own-artworks="useOwnArtworks"
          :search-active="searchActive"
          :is-fetching-next-page="isFetchingNextPage"
          :has-next-page="hasNextPage"
          :fetch-next-page="fetchNextPage"
          :selected-artwork="selectedArtwork"
          :artwork-store="artworkStore"
          @upload="initArtworkCanvas"
          @select-artwork="selectArtwork"
          @blur="handleBlur"
          @activate-search="activateSearch"
        />
      </v-col>
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
  </v-container>
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

</style>
