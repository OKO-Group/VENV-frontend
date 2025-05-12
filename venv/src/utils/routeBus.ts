import mitt from 'mitt'

export const routeBus = mitt<{ 'route-change': { from: string; to: string } }>()
