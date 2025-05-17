<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
import VENV from '@/components/main/VENV.vue'
</script>

<template>
  <StandardPage>
    <v-container class="py-10">
      <VENV location="about" :close-hint="false" />

      <v-card class="pa-1 elevation-2 mx-auto about-card" variant="tonal">
        <v-card-text class="text-body-1">
          <p>
            <i>VENV</i> is yet another initiative to gather a curious community of creators.
          </p>

          <p class="mt-4">
            At its core, <i>VENV</i> begins by offering a fine art database and sharing platform and
            idling screensaver.
          </p>

          <p class="mt-4">
            Account holders enjoy full control over their artworks and exposure. Membership is
            application-based, intentionally designed to grow gradually and mindfully, preserving
            the integrity and alignment of the community.
          </p>

          <p class="mt-4">
            This platform is an open canvas. While its current purpose is rooted in digital fine
            arts, future visions include various endeavors that could be pursued following community's
            wishes and engineer's abilities accordingly.
          </p>
          <p class="mt-8">
            Whatever your background is, <i>VENV</i> welcomes
            you to explore and grow alongside it.
          </p>
        </v-card-text>
      </v-card>
    </v-container>
  </StandardPage>
</template>

<style scoped>
.about-card {
  width: 97%;
  backdrop-filter: blur(15px);
  background-color: rgba(255, 255, 255, 0.8) !important;
}
</style>
