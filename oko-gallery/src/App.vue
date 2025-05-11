<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '@/components/main/NavBar.vue'
import ControlPanel from '@/components/main/ControlPanel.vue'
import GalleryView from '@/views/GalleryView.vue'

</script>
<template>
  <header>
  </header>
  <NavBar />

  <RouterView v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component v-if="Component" :is="Component" />
    </transition>
  </RouterView>

  <GalleryView/>
<!--  <ControlPanel/>-->
  <div id="gui-container" style="position: fixed; bottom: 1rem; right: 1rem; z-index: 9999;"></div>

</template>

<style scoped>

header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 2rem;
  color: white;
  text-align: center;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

/* Fade In/Out Animation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (min-width: 390px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

}
</style>
