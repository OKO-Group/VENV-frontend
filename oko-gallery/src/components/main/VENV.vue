<script setup lang="ts">
import { mdiClose } from '@mdi/js'

defineProps<{
  location: 'home' | 'about'
  closeHint: false
}>()
</script>

<template>
  <div :class="['definition-wrapper', location]">
    <div class="definition-box">
      <div class="text-center">
        <h1 class="definition-word">
          venv <span class="phonetic">/vɛnv/</span> <i>n.</i>
          <p class="definition-line">
            <strong>1.</strong> Abbr. for <i>virtual environment</i>: an isolated digital space
            created for experimentation, system management, or creative projects.
          </p>
        </h1>

        <p class="definition-line">
          <strong>2.</strong> An evolving digital platform curating fine art, functioning as
          interactive repository and/or idling screensaver.
        </p>
        <p class="definition-source">— VENV Manifesto, Founding Edition</p>
        <div v-if="closeHint">
          <v-icon :icon="mdiClose" />
        </div>
      </div>
      <div class="text-right">
        <p>First release: May 25, 2025</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.definition-wrapper {
  display: flex;
  justify-content: center;

  z-index: 1000;
}

/* Conditional styles */
.definition-wrapper.home {
}

.definition-wrapper.about {
  margin-bottom: 0;
  padding: 3rem 1rem;
}

.definition-box {
  color: white;
  width: 100%;
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.88);
  padding: 3rem 1rem;
  font-family: 'Times New Roman', 'Georgia', serif;
}

.definition-word {
  font-size: 2.25rem;
  font-weight: bold;
  font-family: 'Times New Roman', serif;
}

.phonetic {
  font-style: italic;
  font-weight: normal;
  margin-left: 0.5rem;
  font-family: 'Times New Roman', serif;
}

.definition-line {
  font-size: 1.125rem;
  margin-top: 1rem;
  font-family: 'Times New Roman', serif;
}

.definition-source {
  margin-top: 1rem;
  font-size: 0.95rem;
  font-style: italic;
  font-family: 'Times New Roman', serif;
}
</style>
