import type { Artwork, ArtworkFile } from '@/types/oko'

export const fallbackArtworks: Artwork[] = [
  {
    id: 0,
    title: 'Sand Dunes V',
    user: {
      id: 0,
      username: 'System',
      profile_picture: null,
      email: 'System',
      first_name: 'Joe',
      last_name: 'Doe'
    },
    files: [
      {
        id: -105,
        file: '/sand-dunes1_preview.jpg',
        file_thumbnail: '/sand-dunes1_preview.jpg',
        category: 'painting'
      } as ArtworkFile
    ],
    parameters: {},
    description: 'Fallback demo artwork showing procedural sand dunes.',
    soundtracks: {},
    style: 'Procedural',
    genre: 'Landscape',
    media: 'Digital',
    created_at: new Date().toISOString(),
    uploaded_at: new Date().toISOString(),
    visible: true
  },
  {
    id: -1,
    title: 'Sand Dunes V',
    user: {
      id: 0,
      username: 'System',
      profile_picture: null,
      email: 'System',
      first_name: 'Joe',
      last_name: 'Doe'
    },
    files: [
      {
        id: -105,
        file: '/sand-dunes1_albedo.png',
        file_thumbnail: '/sand-dunes1_albedo.png',
        category: 'painting'
      } as ArtworkFile
    ],
    parameters: {},
    description: 'Fallback demo artwork showing procedural sand dunes.',
    soundtracks: {},
    style: 'Procedural',
    genre: 'Landscape',
    media: 'Digital',
    created_at: new Date().toISOString(),
    uploaded_at: new Date().toISOString(),
    visible: true
  },
  {
    id: -2,
    title: 'Sand Dunes II',
    user: {
      id: 0,
      username: 'System',
      profile_picture: null,
      email: 'System',
      first_name: 'Joe',
      last_name: 'Doe'
    },
    files: [
      {
        id: -106,
        file: '/sand-dunes1_ao.png',
        file_thumbnail: '/sand-dunes1_ao.png',
        category: 'painting'
      } as ArtworkFile
    ],
    parameters: {},
    description: 'Fallback demo artwork showing procedural sand dunes.',
    soundtracks: {},
    style: 'Procedural',
    genre: 'Landscape',
    media: 'Digital',
    created_at: new Date().toISOString(),
    uploaded_at: new Date().toISOString(),
    visible: true
  },
  {
    id: -3,
    title: 'Sand Dunes III',
    user: {
      id: 0,
      username: 'System',
      profile_picture: null,
      email: 'System',
      first_name: 'Joe',
      last_name: 'Doe'
    },
    files: [
      {
        id: -107,
        file: '/sand-dunes1_normal-dx.png',
        file_thumbnail: '/sand-dunes1_normal-dx.png',
        category: 'painting'
      } as ArtworkFile
    ],
    parameters: {},
    description: 'Fallback demo artwork showing procedural sand dunes.',
    soundtracks: {},
    style: 'Procedural',
    genre: 'Landscape',
    media: 'Digital',
    created_at: new Date().toISOString(),
    uploaded_at: new Date().toISOString(),
    visible: true
  },
  {
    id: -4,
    title: 'Sand Dunes IV',
    user: {
      id: 0,
      username: 'System',
      profile_picture: null,
      email: 'System',
      first_name: 'Joe',
      last_name: 'Doe'
    },
    files: [
      {
        id: -108,
        file: '/sand-dunes1_height.png',
        file_thumbnail: '/sand-dunes1_height.png',
        category: 'painting'
      } as ArtworkFile
    ],
    parameters: {},
    description: 'Fallback demo artwork showing procedural sand dunes.',
    soundtracks: {},
    style: 'Procedural',
    genre: 'Landscape',
    media: 'Digital',
    created_at: new Date().toISOString(),
    uploaded_at: new Date().toISOString(),
    visible: true
  }
]
