<script setup lang="ts">
import {isMobile} from '@/utils/isMobile.ts'

defineProps<{
  cardClass?: string
}>()
</script>

<template>
  <v-container fluid class="full-screen-container" :style="{ marginTop: isMobile ? '3.5rem' : 0 }">
    <v-card class="dashboard-card" :class="cardClass" :style="{ height: isMobile ? '68vh' : '86vh' }">
      <slot />
    </v-card>
  </v-container>
</template>

<style scoped>
.full-screen-container {
  z-index: 90;
  height: 90vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: stretch;
}

.dashboard-card {
  width: 100vw;
  height: 86vh;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
</style>
