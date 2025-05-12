<script setup lang="ts">
defineProps<{
  cardClass?: string
}>()
</script>

<template>
  <v-container fluid class="full-screen-container">
    <v-card class="dashboard-card" :class="cardClass">
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
