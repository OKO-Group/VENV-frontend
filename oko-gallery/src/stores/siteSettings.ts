// stores/siteSettings.ts
import { defineStore } from 'pinia'

export const useSiteSettings = defineStore('siteSettings', {
  state: () => ({
    zenMode: false,
    enableBackground: false,
  }),
  persist: true, // auto-persist via plugin
})
