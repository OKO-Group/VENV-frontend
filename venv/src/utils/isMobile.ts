import { useMediaQuery } from '@vueuse/core'

//NOTE: reuse removes reactivty (requires page reload)
export const isMobile = useMediaQuery('(max-width: 768px)').value
