<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
import SearchEngine from '@/components/SearchEngine.vue'
</script>

<template>
  <StandardPage>

    <SearchEngine class="pa-4" enable-user-filter />
  </StandardPage>
</template>

<style scoped>

</style>
