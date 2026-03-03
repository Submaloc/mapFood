export type Place = {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  externalId: string | null;
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
  _count?: { comments: number };
};

export type CommentInPlace = {
  id: number;
  placeId: number;
  authorName: string;
  text: string;
  createdAt: string;
};
