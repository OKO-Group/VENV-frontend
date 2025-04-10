<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
</script>

<template>
  <StandardPage>
    <h1 class="about">OKO</h1>
  </StandardPage>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: start;
  }
}
</style>
