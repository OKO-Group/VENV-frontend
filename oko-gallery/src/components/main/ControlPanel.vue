<script setup lang="ts">
import { ref } from 'vue'
import { useSiteSettings } from '@/stores/siteSettings.ts'
import { mdiChevronLeft, mdiTune } from '@mdi/js'

const isExpanded = ref(false)
const settings = useSiteSettings()

function togglePanel() {
  isExpanded.value = !isExpanded.value
}

function retractPanel() {
  isExpanded.value = false
}
</script>

<template>
  <div class="site-panel-wrapper" @mouseleave="retractPanel">
    <!-- Floating Toggle -->
    <v-btn icon variant="tonal" class="toggle-button" color="grey-darken-3" @click="togglePanel">
      <v-icon>{{ isExpanded ? mdiChevronLeft : mdiTune }}</v-icon>
    </v-btn>

    <!-- Panel -->
    <transition name="slide-fade">
      <v-card v-if="isExpanded" class="panel-content pa-3" elevation="10" density="compact">
        <div class="settings-header">SETTINGS</div>

        <v-switch
          v-model="settings.zenMode"
          label="Zen Mode"
          color="rgba(62, 107, 57, 0.5)"
          density="compact"
          hide-details
          class="switch-item"
        />

        <v-switch
          v-model="settings.enableBackground"
          label="KULISSE"
          color="rgba(124, 107, 57, 0.5)"
          density="compact"
          hide-details
          class="switch-item"
        />
      </v-card>
    </transition>
  </div>
</template>

<style scoped>
.site-panel-wrapper {
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.toggle-button {
  z-index: 1000;
  margin-right: 4px;
  border-radius: 999px;
  backdrop-filter: blur(2px);
  background-color: rgba(168, 165, 165, 0.37);
  transition: all 0.3s ease;
}

.panel-content {
  width: 180px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(2px);
  border-radius: 10px;
  color: #fff;
  transition: all 0.4s ease;
  font-size: 0.88rem;
}

.settings-header {
  font-weight: 300;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  color: #5b5858;
  margin-bottom: 6px;
  padding-left: 2px;
}

.switch-item {
  margin-bottom: 4px;
  padding-top: 0px;
  padding-bottom: 0px;
  font-weight: 300;
  letter-spacing: 0.04em;
}

/* Animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
