<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
</script>

<template>
  <StandardPage>
    <v-container class="py-10">

      <v-card class="pa-4 elevation-2 mx-auto about-card" variant="tonal">
        <v-card-text class="text-body-1">
          <div class="text-center">

          <h3><i>TBD!</i></h3>
          </div>
        </v-card-text>
      </v-card>
    </v-container>
  </StandardPage>
</template>

<style scoped>
.about-card {
  width: 100%;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.4) !important;
}
</style>
