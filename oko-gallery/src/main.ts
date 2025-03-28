import './assets/main.css'
import './assets/global.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VueCountryRegionSelect from 'vue3-country-region-select'

import App from './App.vue'
import router from './router'

import vuetify from './plugins/vuetify'
import {useAuthStore} from "@/stores/auth.ts";
const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(VueCountryRegionSelect)

const hello_msg = "Hello curious OKO"
if (await useAuthStore().isAuthenticated()) {
  console.log(hello_msg + ' user')
} else {
  console.log(hello_msg + ' visitor')
}


app.use(router)
app.use(vuetify)
app.mount('#app')
