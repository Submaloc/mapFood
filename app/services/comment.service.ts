import { prisma } from "@/lib/prisma";
import { deleteStoredCommentPhotoFiles } from "@/app/services/comment-photo-storage.service";

function mapCommentPhoto(photo: {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
}) {
  return {
    id: photo.id,
    url: `/api/comment-photos/${photo.id}`,
    fileName: photo.fileName,
    mimeType: photo.mimeType,
    size: photo.size,
  };
}

function mapCommentWithPhotos<T extends {
  photos: Array<{
    id: number;
    fileName: string;
    mimeType: string;
    size: number;
  }>;
}>(comment: T) {
  return {
    ...comment,
    photos: comment.photos.map(mapCommentPhoto),
  };
}

export async function getCommentsByPlace(placeId: number) {
  const comments = await prisma.comment.findMany({
    where: { placeId },
    orderBy: { createdAt: "desc" },
    include: {
      photos: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return comments.map(mapCommentWithPhotos);
}

type CreateCommentParams = {
  placeId: number;
  authorName: string;
  text: string | null;
  rating?: number | null;
  photos?: Array<{
    filePath: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>;
};

export async function createCommentForPlace(params: CreateCommentParams) {
  const { placeId, authorName, text, rating, photos = [] } = params;
  const comment = await prisma.comment.create({
    data: {
      placeId,
      authorName,
      text: (text ?? null) as unknown as string,
      rating: rating ?? null,
      photos: photos.length
        ? {
            create: photos.map((photo) => ({
              filePath: photo.filePath,
              fileName: photo.fileName,
              mimeType: photo.mimeType,
              size: photo.size,
            })),
          }
        : undefined,
    },
    include: {
      photos: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return mapCommentWithPhotos(comment);
}

export async function deleteCommentById(commentId: number) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { photos: true },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  await deleteStoredCommentPhotoFiles(comment.photos.map((photo) => photo.filePath));
}

