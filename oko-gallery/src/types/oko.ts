export interface UserCoreData {
  id: number,
  first_name: string,
  last_name: string,
}

export interface UserBasicData<Picture = MediaFile> extends UserCoreData {
  username: string,
  email: string,
  profile_picture: Picture | File | null,
}

export interface User extends UserBasicData {
  biography: string;
  location: string;
  portfolio_link: string;
  is_approved: boolean;
  is_visible: boolean;
  styles: string[];
  media: string[];
  genres: string[];
}

export interface MediaFile {
  id: number,
  file: string | null,
  file_thumbnail: string | null,
}

export interface ArtworkFile extends MediaFile {
  category: string;
}

export type ArtworkUploadFiles = Record<ArtworkFileCategory, File>

export interface Artwork<Files = ArtworkFile[]> {
  id: number;
  user: UserBasicData;
  files: Files;
  title: string;
  parameters: Partial<ArtworkParameters>;
  description: string;
  soundtracks: Partial<SoundTracks>;
  style: string;
  genre: string;
  media: string;
  created_at: string;
  uploaded_at: string;
  visible: boolean;
}

export interface SoundTracks {
  side_a: string;
  side_b: string;
}

export enum ArtworkSurfaces {
  unknown, linen, cotton, wood, metal, glass,
  ceramic, leather, paper, vinyl, cardboard
}

export interface ArtworkParameters {
  w: number,
  h: number,
  surface_id: ArtworkSurfaces;
}

export function createArtworkCanvas(user: User): Artwork {
  return {
    created_at: '',
    description: '',
    files: [],
    genre: '',
    id: 0,
    media: '',
    soundtracks: {},
    style: '',
    title: '',
    uploaded_at: '',
    user: user,
    visible: false,
    parameters: {}
  }
}

export interface FilterData {
  genre: string | null
  media: string | null
  style: string | null
}


export interface ArtworkSearchQuery extends FilterData {
  q: string | '',
  user: number | null,
}

export interface PaginatedResponse<T> {
  results: T[]
  next: string | null
  previous: string | null
  count: number
}

export enum ArtworkFileCategory {
  SKETCH = 'sketch',
  STUDY = 'study',
  PAINTING = 'painting'
}

export const fileCategories = [
   ArtworkFileCategory.PAINTING,
   ArtworkFileCategory.STUDY,
   ArtworkFileCategory.SKETCH
] as const
