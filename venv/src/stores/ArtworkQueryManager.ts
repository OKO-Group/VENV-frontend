import { unref, type ComputedRef, type Ref, ref, shallowRef } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { useArtworksInfinite } from '@/stores/useArtworkQuery.ts'

import type { Artwork, ArtworkSearchQuery, PaginatedResponse } from '@/types/oko.ts'
import type { InfiniteData } from '@tanstack/vue-query'

export class ArtworkQueryManager {
  q = undefined as ReturnType<typeof useArtworksInfinite> | undefined
  searchQuery = null as ArtworkSearchQuery | null
  searchArtworks = shallowRef<Artwork[]>([])
  qClient = undefined as QueryClient | undefined

  constructor() {}

  query(queryParams: Readonly<Ref<ArtworkSearchQuery>> | ComputedRef) {
    this.q = useArtworksInfinite(queryParams)
    this.qClient = new QueryClient()
    this.searchQuery = queryParams.value
    return this.q
  }

  updateSearchArtworks(artworks: Artwork[]) {
    this.searchArtworks.value = artworks
  }

  replaceArtwork(id: number) {
    if (this.q?.hasNextPage.value) {
      this.q.fetchNextPage().finally(() => this.handleArtworkDelete(id))
    } else {
      this.handleArtworkDelete(id)
    }
  }

  handleArtworkUpdate(updated: Artwork) {
    this.qClient?.setQueryData<InfiniteData<PaginatedResponse<Artwork>>>(
      ['artworks', unref(this.searchQuery)],
      (oldData) =>
        oldData
          ? {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                results: page.results.map((a) => (a.id === updated.id ? updated : a)),
              })),
            }
          : oldData,
    )
  }

  handleArtworkUpload(uploaded: Artwork) {
    this.qClient?.setQueryData<InfiniteData<PaginatedResponse<Artwork>>>(
      ['artworks', unref(this.searchQuery)],
      (oldData) => {
        if (!oldData) return oldData
        const firstPage = oldData.pages[0]
        const newFirstPage = {
          ...firstPage,
          results: [uploaded, ...firstPage.results],
        }
        return {
          ...oldData,
          pages: [newFirstPage, ...oldData.pages.slice(1)],
        }
      },
    )
  }

  handleArtworkDelete(id: number) {
    this.qClient?.setQueryData<InfiniteData<PaginatedResponse<Artwork>>>(
      ['artworks', unref(this.searchQuery)],
      (oldData) =>
        oldData
          ? {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                results: page.results.filter((a) => a.id !== id),
              })),
            }
          : oldData,
    )
  }
}

let instance: ArtworkQueryManager | null = null

export function useArtworkQueryManager() {
  if (!instance) {
    instance = new ArtworkQueryManager()
  }
  return instance
}
