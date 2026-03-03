import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createCommentForPlace,
  getCommentsByPlace,
} from "@/app/services/comment.service";

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
  let body: {
    placeId: number;
    authorName: string;
    text?: string;
    rating?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { placeId, authorName, text, rating } = body;
  if (
    typeof placeId !== "number" ||
    typeof authorName !== "string"
  ) {
    return NextResponse.json(
      {
        error:
          "placeId (number) и authorName (string) обязательны; text (string) и rating (number 1–5) — опциональны",
      },
      { status: 400 }
    );
  }

  const trimmedName = authorName.trim();
  const trimmedText =
    typeof text === "string" ? text.trim() : "";

  const numericRating =
    typeof rating === "number" && Number.isFinite(rating)
      ? Math.round(rating)
      : null;

  if (!trimmedName) {
    return NextResponse.json(
      { error: "authorName must be non-empty" },
      { status: 400 }
    );
  }

  if (!trimmedText && (numericRating === null || numericRating < 1 || numericRating > 5)) {
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

  const comment = await createCommentForPlace({
    placeId,
    authorName: trimmedName,
    text: trimmedText || null,
    rating:
      numericRating !== null && numericRating >= 1 && numericRating <= 5
        ? numericRating
        : null,
  });
  return NextResponse.json(comment);
}

