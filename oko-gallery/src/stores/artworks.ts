import { defineStore } from 'pinia'
import api from '@/api/api'
import { AxiosError, type AxiosResponse, HttpStatusCode } from 'axios'
import { handleBadRequest, handleGenericError } from '@/utils/requests.ts'
import {
  type Artwork,
  ArtworkFileCategory,
  type ArtworkSearchQuery, type ArtworkUploadFiles, createArtworkCanvas, type User,
  type UserCoreData
} from '@/types/oko.ts'
import type { MFAInfo } from '@/types/auth.ts'


export const useArtworkStore = defineStore('artworks', {
  state: () => ({
    userArtworks: [] as Artwork[] | [],
    searchArtworks: [] as Artwork[] | [],
    searchQuery: null as ArtworkSearchQuery | null,
    artworkDraft: null as Artwork | null,
    search: '' as string,
    searchOwn: '' as string,
    statusCode: null as number | null, // Store response status code
    errors: {} as Record<string, string>, // Stores field-specific errors
    artists: [] as UserCoreData[],
  }),
  getters: {},
  persist: {
    pick: ['artworkDraft', 'artworkFilesDraft']
  },
  actions: {
    async _handleError(error: AxiosError) {
      const { statusCode, errors } = handleGenericError(error)
      this.statusCode = statusCode
      this.errors = errors
    },
    resetArtworkDraft(user: User) { //TODO check persistence
      this.artworkDraft = createArtworkCanvas(user)
    },
    async getArtists() {
      try {
        const response: AxiosResponse<UserCoreData[]> = await api.get(`users/artist/?field_set=id`)
        this.statusCode = response.status
        this.artists = response.data
        return response.data as UserCoreData[]
      } catch (error) {
        await this._handleError(error as AxiosError)
      }
      return []
    },
    async getOwnArtworks() {
      try {
        const response: AxiosResponse = await api.get(`artworks/own/`)
        this.statusCode = response.status
      } catch (error) {
        await this._handleError(error as AxiosError)
      }
    },
    async getUserArtworks(id: number) {
      try {
        const response: AxiosResponse = await api.get(`artworks/${id}/user`)
        this.statusCode = response.status
      } catch (error) {
        await this._handleError(error as AxiosError)
      }
    },
    async getArtworks(query: ArtworkSearchQuery) {
      try {
        const response: AxiosResponse = await api.get(`artworks`, { params: query })
        this.statusCode = response.status
      } catch (error) {
        await this._handleError(error as AxiosError)
      }
    },
    async getArtwork(id: number) {
      try {
        const response: AxiosResponse = await api.get(`artwork/${id}`)
        this.statusCode = response.status
      } catch (error) {
        await this._handleError(error as AxiosError)
      }
    },
    async updateArtwork(id: number, data: Record<string, any>) {
      try {
        const response: AxiosResponse = await api.patch(`artworks/${id}/`, data,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        this.statusCode = response.status
        return response.data as Artwork
      } catch (error) {
        await this._handleError(error as AxiosError)
        return null
      }
    },
    async uploadArtwork(data: Record<string, any>) {
      try {
        const response: AxiosResponse = await api.post(`artworks/`, data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        this.statusCode = response.status
        return response.data as Artwork
      } catch (error) {
        await this._handleError(error as AxiosError)
        return null
      }
    },
    async deleteArtwork(id: number) {
      try {
        const response: AxiosResponse = await api.delete(`artworks/${id}/`)
        this.statusCode = response.status
        return response.data as Artwork
      } catch (error) {
        await this._handleError(error as AxiosError)
        return null
      }
    },
    async deleteArtworkFiles(id: number, categories: ArtworkFileCategory[]) {
      try {
        const response: AxiosResponse = await api.delete(`artworks/${id}/files/`, {
          data: { categories }
        })
        this.statusCode = response.status
        return response.data as Artwork
      } catch (error) {
        await this._handleError(error as AxiosError)
        return null
      }
    }
  }
})
