<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
import VENV from '@/components/main/VENV.vue'
</script>

<template>
  <StandardPage>
    <v-container class="py-10">
      <VENV location="about" :close-hint="false"/>

      <v-card class="pa-4 elevation-2 mx-auto about-card" variant="tonal">
        <v-card-text class="text-body-1">
          <p>
            <strong>VENV</strong> is yet another initiative born from the intersection of technology and art. It aims to gather a curious community of artists, creators, and engineers exploring the world of expression.
          </p>

          <p class="mt-4">
            At its core, VENV offers a fine art database and sharing platform with a twist: artworks are embedded within a 3D environment — a serene dune landscape that gently shifts from day to night. It's both a screensaver and a gateway into curated creativity. Users may also navigate via a fast, built-in search engine.
          </p>

          <p class="mt-2">
            Account holders enjoy full control over their artworks and visibility. Membership is application-based, intentionally designed to grow gradually and mindfully, preserving the integrity and alignment of the community.
          </p>

          <p class="mt-2">
            This platform is an open canvas. While its current purpose is rooted in digital fine arts, future visions include machine learning-driven recommendations, theme associations, user-influenced content training, and more.
          </p>
          <p class="mt-2">
            Whether you're an artist, a developer-turned-creator, or simply curious, VENV welcomes you to explore and grow alongside it.
          </p>
        </v-card-text>
      </v-card>
    </v-container>
  </StandardPage>
</template>


<style scoped>
.about-card {
  width: 100%;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.42) !important;
}
</style>
