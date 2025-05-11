<script setup lang="ts">
import { ref } from 'vue'
import { mdiChevronUp, mdiChevronDown, mdiFilter } from '@mdi/js'

defineProps<{
  filters: any
  filterdb: any
  artists: any
  enableUserFilter: boolean
}>()

const isExpanded = ref(false)
</script>

<template>
  <v-card class="filter-card d-flex flex-column align-center pa-2">
    <transition name="collapse">
      <div v-show="isExpanded" class="w-100">
        <div class="toggle-wrapper" @click="isExpanded = !isExpanded">
          <v-icon class="mb-2 mt-2 text-center w-100">{{ mdiFilter }}</v-icon>
        </div>
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
        />

        <v-autocomplete
          v-if="enableUserFilter"
          v-model="filters.user"
          :items="artists"
          :item-title="(item) => `${item.first_name} ${item.last_name}`"
          item-value="id"
          chips
          closable-chips
          label="Artist"
          variant="outlined"
          density="compact"
        />
      </div>
    </transition>

    <!-- Toggle Icon -->
    <div class="toggle-wrapper" @click="isExpanded = !isExpanded">
      <v-icon>
        {{ isExpanded ? mdiChevronUp : mdiFilter }}
      </v-icon>
    </div>
  </v-card>
</template>

<style scoped>
.filter-card {
  width: 100%;
  overflow: hidden;
  transition: height 0.33s ease;
  cursor: pointer;
}

.toggle-wrapper {
  width: 100%;
  max-width: 100%;
  height: 33px; /* slightly taller than the icon */
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.filter-icon {
  align-self: center;
}

.toggle-icon {
  font-size: 25px;
  align-self: center;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.33s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
