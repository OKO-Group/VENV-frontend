<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
import SearchEngine from '@/components/SearchEngine.vue'
import { useMediaQuery } from '@vueuse/core'
const isMobile = useMediaQuery('(max-width: 768px)')

</script>

<template>
  <StandardPage>
    <SearchEngine :style="{'padding': isMobile ? 0 : 4}" enable-user-filter />
  </StandardPage>
</template>

<style scoped>

</style>
