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

.center-stripe {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 88px;
  background-color: #9b0909; /* strong red */
  z-index: 0; /* ensure it's behind other content */
}

.corner-poem {
  position: fixed;
  bottom: 33px;
  right: 33px;
  font-size: 1rem;
  font-style: italic;
  text-align: left;
  line-height: 1.4;
  max-width: 280px;
  pointer-events: none;
}

</style>

<template>
  <main style="z-index: 5; position: relative">
    <!-- Red background stripe -->
    <div class="center-stripe" aria-hidden="true"></div>

    <v-dialog v-model="isOpen" transition="slide-y-transition" width="auto" @click="isOpen = false">
      <template #activator="{ on, attrs }"></template>
      <v-card class="elevation-10" style="position: relative; max-width: 1000px">
        <VENV location="home" :closeHint="true" />
      </v-card>
    </v-dialog>

    <!-- Poem in bottom-right corner -->
    <div class="corner-poem">
      <p>
        In this virtual sea,<br />
        What is true relevancy?<br />
        Who am I to you?<br />
        Who are you, to me?<br />
      </p>
    </div>
  </main>
</template>
