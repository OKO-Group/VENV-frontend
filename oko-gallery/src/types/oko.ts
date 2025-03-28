

type FilterData = {
  genres: string[]
  media: string[]
  styles: string[]
}

export interface UserCoreData {
  id: number,
  username: string,
  email: string,
  first_name: string,
  last_name: string,
}

export interface User extends UserCoreData{
  profile_picture: File | null,
  biography: string;
  location: string;
  portfolio_link: string;
  is_approved: boolean;
  is_visible: boolean;
}

export interface ArtworkUser extends Omit<UserCoreData, 'email'> {
  profile_thumbnail: File | null,
}

export interface ArtworkFile {
  id: number;
  file: string;
  category: string;
}

export interface ArtworkThumbnail extends Omit<ArtworkFile, 'file'> {
  file_thumbnail: string;
}

export interface Artwork<TFile = ArtworkFile, Author = ArtworkUser> {
  id: number;
  user: Author;
  files: TFile[];
  title: string;
  description: string;
  soundtracks: string[];
  style: string;
  genre: string;
  media: string;
  created_at: number;
  uploaded_at: number;
  visible: boolean;
}

export interface ArtworkSearchQuery {
  search: string,
  style: string[] | null,
  genre: string[] | null,
  media: string[] | null,
  user: number | null,
}
