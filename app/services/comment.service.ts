import { prisma } from "@/lib/prisma";

export async function getCommentsByPlace(placeId: number) {
  return prisma.comment.findMany({
    where: { placeId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCommentForPlace(params: {
  placeId: number;
  authorName: string;
  text: string;
}) {
  const { placeId, authorName, text } = params;
  return prisma.comment.create({
    data: {
      placeId,
      authorName,
      text,
    },
  });
}

