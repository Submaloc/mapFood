export type CommentPhoto = {
  id: number;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type Comment = {
  id: number;
  placeId: number;
  authorName: string;
  text?: string | null;
  rating?: number | null;
  createdAt: string;
  photos?: CommentPhoto[];
};

export type CreateCommentBody = {
  placeId: number;
  authorName: string;
  text?: string;
  rating?: number | null;
};
