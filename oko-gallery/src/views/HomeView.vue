<script setup lang="ts">
import { useArtworkStore } from '@/stores/artworks.ts'
import { onBeforeMount, onMounted, ref } from 'vue'
import VENV from '@/components/main/VENV.vue'
import { useRoute } from 'vue-router'

const artworkStore = useArtworkStore()

onMounted(() => {
  artworkStore.cameraPos = [0, 1.8, 20]
})
const isOpen = ref(false)

const route = useRoute()

onBeforeMount(() => {
  const hasSeenIntro = localStorage.getItem('venv_intro_shown')
  const isFirstVisit = !hasSeenIntro

  if (isFirstVisit) {
    isOpen.value = true
    localStorage.setItem('venv_intro_shown', 'true')
  }
})
</script>

<style scoped>
/* Frosted glass effect on the dialog overlay */
.v-dialog {
  background-color: rgba(145, 145, 145, 0.15) !important; /* faint dark tint */
  backdrop-filter: blur(5px) !important;
  -webkit-backdrop-filter: blur(5px) !important;
}
</style>

<template>
  <main style="z-index: 5">
    <v-dialog v-model="isOpen" transition="slide-y-transition" width="auto" @click="isOpen = false">
      <template #activator="{ on, attrs }"></template>
      <v-card class="elevation-10" style="position: relative; max-width: 1000px">
        <VENV location="home" closeHint="true" />
      </v-card>
    </v-dialog>
  </main>
</template>
