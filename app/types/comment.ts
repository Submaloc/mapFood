export type Comment = {
  id: number;
  placeId: number;
  authorName: string;
  text: string;
  createdAt: string;
};

export type CreateCommentBody = {
  placeId: number;
  authorName: string;
  text: string;
};
