export type Place = {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  externalId: string | null;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: CommentInPlace[];
  _count?: { comments: number };
};

export type PlaceListItem = {
  id: number;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  isManual?: boolean;
  _count?: { comments: number };
  /** Средний рейтинг по комментариям (1–5), до одного знака */
  averageRating?: number | null;
  /** Количество оценок (комментариев с рейтингом) */
  ratingCount?: number;
};

export type CommentInPlace = {
  id: number;
  placeId: number;
  authorName: string;
  text: string;
  createdAt: string;
};
