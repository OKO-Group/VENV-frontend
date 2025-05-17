<script setup lang="ts">
import { computed, nextTick, ref, shallowRef } from 'vue'
import { mdiEyeOutline } from '@mdi/js'
import type { Artwork } from '@/types/oko'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useIntersectionObserver } from '@vueuse/core'
import { useArtworkStore } from '@/stores/artworks.ts'
import { isMobile } from '@/utils/isMobile.ts'

useArtworkStore()
const scrollbarOptions = {
  wheelPropagation: false,
  suppressScrollX: true,
  maxScrollbarLength: 100,
  wheelSpeed: 0.2
}

const props = defineProps<{
  artworks: Artwork[]
  viewMode: 'relaxed' | 'compact' | 'grid'
  selectedArtworkId?: number | null
  useOwnArtworks?: boolean
  hasNextPage: boolean
  isFetchingNext: boolean
  fetchNextPage: () => Promise<any>
}>()

const emit = defineEmits<{
  (e: 'select', artwork: Artwork): void
}>()

function hasImage(artwork: Artwork): boolean {
  return !!artwork.files.find((f) => f.category === 'painting')
}

function getThumb(artwork: Artwork): string | undefined {
  return artwork.files.find((f) => f.category === 'painting')?.file_thumbnail || undefined
}

async function handleClick(item: Artwork) {
  emit('select', item)
}

function titleClass(mode: string) {
  return mode === 'compact' ? 'text-caption font-weight-medium' : 'font-weight-medium'
}

function imageSize(mode: string): number {
  return mode === 'compact' ? 40 : mode === 'relaxed' ? 80 : 160
}

const tableHeaders = [
  { title: '#', key: 'index', width: 40, sortable: false },
  { title: 'Title', key: 'title', align: 'center', sortable: true },
  {
    title: 'Artwork',
    key: 'artwork',
    width: 100,
    sortable: false,
    align: 'center'
  },
  { title: 'Date', key: 'created_at', align: 'end' }
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString()
}

const artworksWithIndex = computed(() =>
  (props.useOwnArtworks ? props.artworks : props.artworks.filter((a) => getThumb(a))).map(
    (a, i) => ({
      raw: a,
      index: i + 1,
      title: a.title,
      artwork: getThumb(a),
      created_at: formatDate(a.created_at)
    })
  )
)

// Handle bottom visibility to trigger fetch
const isFetching = shallowRef(false)
const tableRef = ref<HTMLElement | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)

useIntersectionObserver(loadMoreTrigger, async ([{ isIntersecting }]) => {
  if (isIntersecting && !isFetching.value && props.hasNextPage) {
    isFetching.value = true
    props.fetchNextPage().finally(() => {
      isFetching.value = false
    })
  }
})
</script>

<template>
  <PerfectScrollbar class="ps-bar"
                    :style="{'max-height': isMobile ? '70vh' : '80vh', 'overflow-x': 'hidden'}"
                    :options="scrollbarOptions" ref="tableRef">
    <div class="artwork-list">
      <!-- Grid layout -->
      <div v-if="viewMode === 'grid'">
        <v-row style="max-height: 78vh;" dense>
          <v-col
            v-for="(item, index) in artworks"
            :key="item.id"
            v-show="useOwnArtworks || hasImage(item)"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              class="pa-1 mb-0.5 text-center"
              :elevation="selectedArtworkId === item.id ? 3 : 0"
              @click="handleClick(item)"
              variant="tonal"
            >
              <v-img v-if="hasImage(item)" :src="getThumb(item)" height="160"
                     class="mb-1 artwork" />
              <v-icon v-else :icon="mdiEyeOutline" size="160" class="mb-1" />
              <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
              <div class="text-caption grey--text">
                {{ new Date(item.uploaded_at).toLocaleDateString() }}
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Scrollable table wrapper -->
      <v-data-table-virtual
        v-else
        :items="artworksWithIndex"
        :key="artworksWithIndex.length"
        class="artwork-table text-caption"
        density="compact"
        hide-default-footer
        hide-no-data
        hover
        hide-default-header
      >
        <template #item="{ item }">
          <tr
            @click="handleClick(item.raw)"
            :class="['artwork-row', { 'is-selected': selectedArtworkId === item.raw.id }]"
          >
            <td class="text-center index-col">
              {{ item.index }}
            </td>
            <td class="text-left title-col pl-8">
              <span :class="titleClass(viewMode)">{{ item.title }}</span>
            </td>
            <td class="text-center thumb-col">
              <v-img
                v-if="item.artwork"
                :src="item.artwork"
                :height="imageSize(viewMode)"
                class="rounded artwork"
                style="margin: 4px"
              />
              <v-icon v-else :icon="mdiEyeOutline" :size="imageSize(viewMode)" class="rounded" />
            </td>
            <td class="text-end date-col">
              {{ item.created_at }}
            </td>
          </tr>
        </template>
      </v-data-table-virtual>
    </div>
    <tr>
      <td :colspan="4" class="text-center">
        <div ref="loadMoreTrigger" style="height: 1px"></div>
      </td>
    </tr>
    <div class="text-center">
      <v-progress-circular v-if="isFetchingNext" indeterminate />
    </div>
  </PerfectScrollbar>

</template>

<style scoped>
.ps-bar {
  overflow: auto; /* perfect-scrollbar manages overflow itself */
  display: flex;
  flex-direction: column;
  background-color: rgba(220, 220, 220, 0);
}


.artwork-list {
  display: flex;
  flex-direction: column;
}

.artwork-list::-webkit-scrollbar {
  display: none;
}

.artwork-table {
  background-color: rgba(220, 220, 220, 0.2);
}

.artwork-table ::v-deep(tbody td) {
  border-bottom: none !important;
}

.artwork-table ::v-deep(tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.03) !important;
}

.artwork-table tr {
  transition: background-color 0.2s ease;
}

.artwork-table tr:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.artwork-table ::v-deep(.v-table__wrapper) {
  overflow-x: hidden;
  overflow-y: hidden;
}

.artwork-row {
  background-color: rgba(220, 219, 219, 0.6);
  transition: box-shadow 0.33s ease,
  background-color 0.33s ease,
  transform 0.33s ease;
}

.artwork-row:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  background-color: rgba(238, 238, 238, 0.71);
  transform: scaleX(1.008) scaleY(1.008);
  transition: box-shadow 0.33s ease,
  transform 0.33s ease;
}

.artwork-row.is-selected {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  background-color: rgba(208, 216, 224, 0.82); /* soft blue for selection */
  border-left: 4px solid #92b7dc;
}

.index-col {
  width: 2vw;
}

.thumb-col {
  min-width: 10vw;
  max-width: 10vw;
}

.date-col {
  padding-right: 1vw;
  min-width: 8vw;
  max-width: 8vw;
}

.title-col {
  min-width: 7vw;
  max-width: 7vw;
  white-space: normal;
  word-break: break-word;
}
</style>
