<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import NavBar from '@/components/main/NavBar.vue'
import ControlPanel from '@/components/main/ControlPanel.vue'
import GalleryView from '@/views/GalleryView.vue'
import { routeBus } from '@/utils/routeBus.ts'
import {watch} from 'vue'
import { watchEffect } from 'vue'
import { useDebounceFn, usePreferredDark } from '@vueuse/core'
import { useSiteSettings } from '@/stores/siteSettings'

const route = useRoute()
const settings = useSiteSettings()
const isSystemDark = usePreferredDark()
import { useTheme } from 'vuetify'

const theme = useTheme()

watch(() => route.path, (to, from) => {
  routeBus.emit('route-change', { from, to })
    // if (!theme.current.value.dark){
    //   if (to === '/') {
    //     useDebounceFn(() => {
    //       // theme.themes.value['lightTheme'].colors.background = '#e03131'
    //     }, 500)()
    //   } else {
    //     useDebounceFn(() => {
    //       theme.themes.value['lightTheme'].colors.background = '#eeeeee'
    //     }, 0)()
    //   }
    // }
})

watchEffect(() => {
  const mode = settings.mode

  if (mode === 'light') {
    theme.global.name.value = 'lightTheme'
    document.body.classList.remove('theme-dark')
    document.body.classList.add('theme-light')
  } else if (mode === 'dark') {
    theme.global.name.value = 'darkTheme'
    document.body.classList.remove('theme-light')
    document.body.classList.add('theme-dark')
  } else if (mode === 'dune') {
    // use system Vuetify theme
    theme.global.name.value = isSystemDark.value ? 'darkTheme' : 'lightTheme'
    document.body.classList.remove('theme-dark', 'theme-light')
    document.body.classList.add(isSystemDark.value ? 'theme-dark' : 'theme-light')
  }
})


</script>
<template>
  <v-app class="scrollable">

  <header></header>
  <NavBar />

  <RouterView v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component v-if="Component" :is="Component" />
    </transition>
  </RouterView>

  <GalleryView v-if="settings.mode === 'dune'"/>
   <ControlPanel/>
  </v-app>

</template>

<style scoped>

.scrollable {
    height: 100%;
    overflow-y: auto;
  -webkit-overflow-scrolling: touch;

}
header {
  position: fixed;
  top: 1rem;
  width: 100%;
  text-align: center;
}

/* Fade In/Out Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (min-width: 390px) {
  header {
    display: flex;
    place-items: center;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
