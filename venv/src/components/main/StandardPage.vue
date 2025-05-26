<script setup lang="ts">
import {isMobile} from '@/utils/isMobile.ts'

defineProps<{
  cardClass?: string
}>()
</script>

<template>
  <v-container fluid class="full-screen-container pa-0 fill-height" :style="{ marginTop: 0 }">
    <v-card class="dashboard-card" :class="cardClass" :style="{ height: isMobile ? '100vh' : '90vh' ,
    width: isMobile ? '92vw' : '99vw' }">
      <slot />
    </v-card>
  </v-container>
</template>

<style scoped>
.full-screen-container {
  flex: 1;
  z-index: 90;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
}

.dashboard-card {

  width: 92vw;
  flex-direction: column;
  overflow: auto;
}
</style>
