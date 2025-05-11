import { useInfiniteQuery } from '@tanstack/vue-query'
import api from '@/api/api'
import type { Artwork, ArtworkSearchQuery, PaginatedResponse } from '@/types/oko.ts'
import { computed, type ComputedRef, type Ref } from 'vue'

//TODO media caching
export function useArtworksInfinite(queryParams: Readonly<Ref<ArtworkSearchQuery>> | ComputedRef) {
  return useInfiniteQuery({
    queryKey: computed(() => ['artworks', queryParams.value]),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<PaginatedResponse<Artwork>>('artworks/', {
        params: { ...queryParams.value, page: pageParam },
      })
      return response.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      return !lastPage.next ? undefined : lastPageParam + 1
    },
    getPreviousPageParam: (firstPage, pages, firstPageParam) => {
      return !firstPage.previous ? undefined : firstPageParam - 1
    },
    staleTime: 1000 * 60 * 30, // 1 hour = how long data is "fresh"
    gcTime: 1000 * 60 * 60, // 1 hour
  })
}
