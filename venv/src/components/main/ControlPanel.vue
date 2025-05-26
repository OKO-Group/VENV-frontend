<script setup lang="ts">
import { ref } from 'vue'
import { useSiteSettings } from '@/stores/siteSettings.ts'
import {
  mdiChevronLeft, mdiCog,
  mdiImageFilterHdr,
  mdiMoonFirstQuarter, mdiMoonWaningCrescent,
  mdiSunAngle,
  mdiTune, mdiWeatherNight, mdiWhiteBalanceSunny
} from '@mdi/js'
import { useDebounceFn } from '@vueuse/core'

const isExpanded = ref(false)
const settings = useSiteSettings()

let retractTimeout: ReturnType<typeof setTimeout> | null = null

function togglePanel() {
  isExpanded.value = !isExpanded.value
}

function scheduleRetract() {
  retractTimeout = setTimeout(() => {
    isExpanded.value = false
  }, 400)
}

function cancelRetract() {
  if (retractTimeout) {
    clearTimeout(retractTimeout)
    retractTimeout = null
  }
}
</script>

<template>
  <div class="site-panel-wrapper"   @mouseleave="scheduleRetract"
       @mouseenter="cancelRetract">
    <!-- Floating Toggle -->
    <v-btn
      icon
      class="toggle-button"
      @click="togglePanel"
    >
      <v-icon>{{ isExpanded ? mdiChevronLeft : mdiCog }}</v-icon>
    </v-btn>

    <!-- Absolutely positioned Panel -->
    <transition name="slide-fade">
      <div v-if="isExpanded" class="panel-container">
        <v-card class="pa-3" elevation="10" density="compact">
          <v-btn-toggle
            v-model="settings.mode"
            label="Theme"
            density="compact"
            class="switch-item"
          >
            <v-btn :icon="mdiWhiteBalanceSunny"  value="light" color="grey-darken-3"/>
            <v-btn  :icon="mdiWeatherNight" value="dark" color="grey-darken-3" />
            <v-btn :icon="mdiImageFilterHdr" value="dune" color="grey-darken-3" />
          </v-btn-toggle>
        </v-card>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.site-panel-wrapper {
  position: fixed;
  bottom: 1vw;
  left: 1vw;
  z-index: 999;
}

.toggle-button {
  transition: all 0.3s ease;
  opacity: 0.88;
}

.switch-item {
  opacity: 0.7;
}
.panel-container {
  position: absolute;
  bottom: 50px; /* Adjust as needed */
  left: 0;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

</style>
