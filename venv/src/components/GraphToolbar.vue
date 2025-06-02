<template>
  <v-toolbar
    flat
    height="64"
    class="graph-toolbar px-4"
  >
    <v-spacer />

    <v-text-field
      v-model="search"
      :append-inner-icon="mdiMagnify"
      density="compact"
      hide-details
      placeholder="EXPLORE"
      class="search-input"
      variant="solo-filled"
      style="max-width: 320px; opacity: 0.7"
    />

    <v-spacer />
  </v-toolbar>
</template>


<script setup lang="ts">
import { ref, watch } from 'vue'
import { mdiMagnify } from '@mdi/js'
import { useDebounceFn } from '@vueuse/core'

const search = ref('')

const emit = defineEmits(['search'])

watch(search, (val) => useDebounceFn(() => emit('search', val), 1000)())
</script>
