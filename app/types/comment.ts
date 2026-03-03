export type Comment = {
  id: number;
  placeId: number;
  authorName: string;
  text?: string | null;
  rating?: number | null;
  createdAt: string;
};

export type CreateCommentBody = {
  placeId: number;
  authorName: string;
  text?: string;
  rating?: number | null;
};
