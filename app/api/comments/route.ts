import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createCommentForPlace,
  deleteCommentById,
  getCommentsByPlace,
} from "@/app/services/comment.service";
import {
  deleteStoredCommentPhotoFiles,
  saveCommentPhotoFiles,
} from "@/app/services/comment-photo-storage.service";

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json(
      { error: "placeId is required" },
      { status: 400 }
    );
  }
  const id = parseInt(placeId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid placeId" }, { status: 400 });
  }

  const comments = await getCommentsByPlace(id);
  return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const placeIdValue = formData.get("placeId");
  const authorNameValue = formData.get("authorName");
  const textValue = formData.get("text");
  const ratingValue = formData.get("rating");
  const photoFiles = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const placeId =
    typeof placeIdValue === "string" ? parseInt(placeIdValue, 10) : NaN;

  if (Number.isNaN(placeId) || typeof authorNameValue !== "string") {
    return NextResponse.json(
      {
        error:
          "placeId и authorName обязательны; text, rating и photos — опциональны",
      },
      { status: 400 }
    );
  }

  const trimmedName = authorNameValue.trim();
  const trimmedText =
    typeof textValue === "string" ? textValue.trim() : "";
  const parsedRating =
    typeof ratingValue === "string" && ratingValue !== ""
      ? Number(ratingValue)
      : null;

  const numericRating =
    parsedRating !== null && Number.isFinite(parsedRating)
      ? Math.round(parsedRating)
      : null;

  if (!trimmedName) {
    return NextResponse.json(
      { error: "authorName must be non-empty" },
      { status: 400 }
    );
  }

  if (
    !trimmedText &&
    (numericRating === null || numericRating < 1 || numericRating > 5)
  ) {
    return NextResponse.json(
      {
        error:
          "Нужен либо непустой текст комментария, либо рейтинг от 1 до 5.",
      },
      { status: 400 }
    );
  }

  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }

  let savedPhotos: Awaited<ReturnType<typeof saveCommentPhotoFiles>> = [];

  try {
    savedPhotos = await saveCommentPhotoFiles(photoFiles);

    const comment = await createCommentForPlace({
      placeId,
      authorName: trimmedName,
      text: trimmedText || null,
      rating:
        numericRating !== null && numericRating >= 1 && numericRating <= 5
          ? numericRating
          : null,
      photos: savedPhotos,
    });

    return NextResponse.json(comment);
  } catch (e) {
    await deleteStoredCommentPhotoFiles(savedPhotos.map((photo) => photo.filePath));
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: message || "Не удалось сохранить комментарий" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Comment id is required" },
      { status: 400 }
    );
  }
  const commentId = parseInt(id, 10);
  if (Number.isNaN(commentId)) {
    return NextResponse.json(
      { error: "Invalid comment id" },
      { status: 400 }
    );
  }
  try {
    await deleteCommentById(commentId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Failed to delete comment", details: message },
      { status: 500 }
    );
  }
}

