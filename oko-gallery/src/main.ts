import './assets/main.css'
import './assets/global.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VueCountryRegionSelect from 'vue3-country-region-select'

import App from './App.vue'
import router from './router'

import vuetify from './plugins/vuetify'
import { useAuthStore } from '@/stores/auth.ts'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar'

import Tres from '@tresjs/core'


import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  missing: (locale, key) => key

})


const app = createApp(App)
const pinia = createPinia()
app.use(i18n)
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(VueCountryRegionSelect)
app.use(PerfectScrollbarPlugin, { componentName: 'Scrollbar' })
app.use(Tres)

const hello_msg = 'Hello curious VENV'
useAuthStore().isAuthenticated().then((res) => {
  if (res) {
    console.log(hello_msg + ' user')
  } else {
    console.log(hello_msg + ' visitor')
  }
})


app.use(VueQueryPlugin)

app.use(router)
app.use(vuetify)
app.mount('#app')
