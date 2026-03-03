import { prisma } from "@/lib/prisma";

export async function getCommentsByPlace(placeId: number) {
  return prisma.comment.findMany({
    where: { placeId },
    orderBy: { createdAt: "desc" },
  });
}

type CreateCommentParams = {
  placeId: number;
  authorName: string;
  text: string | null;
  rating?: number | null;
};

export async function createCommentForPlace(params: CreateCommentParams) {
  const { placeId, authorName, text, rating } = params;
  return prisma.comment.create({
    data: {
      placeId,
      authorName,
      // Prisma тип поля text: String? — допускает null
      text: (text ?? null) as unknown as string,
      rating: rating ?? null,
    },
  });
}

