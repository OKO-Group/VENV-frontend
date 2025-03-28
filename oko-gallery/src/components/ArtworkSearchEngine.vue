<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useArtworkStore } from '@/stores/artworks';
import { mdiPlusCircle, mdiMagnify } from '@mdi/js';
import { genres, styles, media } from '@/assets/filters.json';
import type { Artwork } from '@/types/oko.ts'

const props = defineProps<{
  showUpload?: boolean;
  enableUserFilter?: boolean;
  useOwnArtworks?: boolean;
  onSelect: (artwork: Artwork) => void;
}>();

const emit = defineEmits(['addArtwork']);

const artworkStore = useArtworkStore();

const searchInput = ref('');
const sortBy = ref('date');

const filters = ref({
  style: [] as string[],
  genre: [] as string[],
  media: [] as string[],
  user: null as number | null,
});

let debounceTimeout: NodeJS.Timeout | null = null;

// Auto-load user artworks in studio mode
onMounted(async () => {
  if (props.useOwnArtworks) {
    await artworkStore.getUserArtworks();
  }
});

// 🔍 Debounced Search API Call
watch(searchInput, (query) => {
  if (props.useOwnArtworks) return;

  if (debounceTimeout) clearTimeout(debounceTimeout);
  if (!query || query.length < 2) return;

  debounceTimeout = setTimeout(async () => {
    const queryObj = {
      search: query,
      style: filters.value.style,
      genre: filters.value.genre,
      media: filters.value.media,
      user: props.enableUserFilter ? filters.value.user : null,
    };

    artworkStore.searchQuery = queryObj;
    await artworkStore.getArtworkSearchQuery(queryObj);
  }, 500);
});

// 📦 Artworks to show (based on prop)
const artworks = computed(() =>
  props.useOwnArtworks ? artworkStore.userArtworks : artworkStore.searchArtworks
);

// 🎛 Filtered + Sorted Results
const filteredArtworks = computed(() => {
  return artworks.value
    .filter(a => {
      const matchesStyle = filters.value.style.length === 0 || filters.value.style.includes(a.style);
      const matchesGenre = filters.value.genre.length === 0 || filters.value.genre.includes(a.genre);
      const matchesMedia = filters.value.media.length === 0 || filters.value.media.includes(a.media);
      const matchesUser = !props.enableUserFilter || filters.value.user === null || a.user.id === filters.value.user;
      return matchesStyle && matchesGenre && matchesMedia && matchesUser;
    })
    .sort((a, b) => {
      if (sortBy.value === 'title') return a.title.localeCompare(b.title);
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    });
});

const userOptions = computed(() => {
  const all = props.useOwnArtworks ? artworkStore.userArtworks : artworkStore.searchArtworks;
  return Array.from(new Map(all.map(a => [a.user.id, a.user])).values());
});
</script>


<template>
  <v-row>
    <!-- Left: Filters -->
    <v-col cols="3" class="pr-4">
      <v-card class="pa-4 d-flex flex-column fill-height">
        <v-select
          v-model="sortBy"
          :items="['date', 'title']"
          label="Sort by"
          variant="outlined"
          density="compact"
          class="mb-4"
        />

        <v-autocomplete
          v-model="filters.style"
          :items="styleOptions"
          multiple chips closable-chips
          label="Style" variant="outlined" density="compact"
          class="mb-4"
        />

        <v-autocomplete
          v-model="filters.genre"
          :items="genreOptions"
          multiple chips closable-chips
          label="Genre" variant="outlined" density="compact"
          class="mb-4"
        />

        <v-autocomplete
          v-model="filters.media"
          :items="mediaOptions"
          multiple chips closable-chips
          label="Media" variant="outlined" density="compact"
        />

        <v-autocomplete
          v-if="props.enableUserFilter"
          v-model="filters.user"
          :items="userOptions"
          item-title="username"
          item-value="id"
          label="Artist"
          variant="outlined"
          class="mt-4"
          density="compact"
        />
      </v-card>
    </v-col>

    <!-- Right: Search + List -->
    <v-col cols="9">
      <v-card class="pa-4 d-flex flex-column fill-height">
        <!-- Search -->
        <v-text-field
          v-model="searchQuery"
          label="Search artworks..."
          variant="outlined"
          density="comfortable"
          class="mb-4"
        >
          <template #prepend-inner>
            <v-icon :icon="mdiMagnify" />
          </template>
        </v-text-field>

        <!-- Upload button -->
        <v-btn
          v-if="props.showUpload"
          icon
          color="black"
          class="mb-4 mx-auto"
          @click="$emit('addArtwork')"
        >
          <v-icon :icon="mdiPlusCircle" />
        </v-btn>

        <!-- Virtual Scroll -->
        <v-virtual-scroll
          :items="filteredArtworks"
          item-height="150"
          height="calc(100vh - 260px)"
        >
          <template #default="{ item, index }">
            <v-card
              class="d-flex pa-3 mb-2 align-center"
              @click="() => props.onSelect(item)"
              elevation="1"
            >
              <div class="mr-4 font-weight-bold">{{ index + 1 }}</div>
              <v-img :src="item.files[0]?.file_thumbnail" height="80" width="80" class="mr-4 rounded" />
              <div>
                <div class="font-weight-medium">{{ item.title }}</div>
                <div class="text-grey text-caption">{{ item.description }}</div>
                <div class="text-caption text-grey-darken-1 mt-1">
                  Artist: {{ item.user.username }} | Added: {{ new Date(item.uploaded_at).toLocaleDateString() }}
                </div>
              </div>
            </v-card>
          </template>
        </v-virtual-scroll>
      </v-card>
    </v-col>
  </v-row>
</template>
