import { defineStore } from 'pinia'
import api from '@/api/api'
import { AxiosError, type AxiosResponse, HttpStatusCode } from 'axios'
import { handleBadRequest, handleGenericError } from '@/utils/requests.ts'
import type { Artwork, ArtworkSearchQuery } from '@/types/oko.ts'


export const useArtworkStore = defineStore('artworks', {
  state: () => ({
    userArtworks: [] as Artwork[] | [],
    searchArtworks: [] as Artwork[] | [],
    searchQuery: null as ArtworkSearchQuery[] | null
  }),
  getters: {},
  actions: {
    async getUserArtworks() {
      //updates userArtworks and also returns it
    },
    async getArtworkSearchQuery(query: ArtworkSearchQuery) {
      //updates searchArtworks and also returns it
    },
    async updateArtwork(data: Record<string, any>) {
      //update user's artwork
    },
    async deleteArtwork(id: string) {}
  }
})
