// stores/siteSettings.ts
import { defineStore } from 'pinia'

export const useSiteSettings = defineStore('siteSettings', {
  state: () => ({
    mode: 'dark' as 'dark' | 'light' | 'dune',
  }),
  persist: true, // auto-persist via plugin
})
