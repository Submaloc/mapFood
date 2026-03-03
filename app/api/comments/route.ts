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
  let body: { placeId: number; authorName: string; text: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { placeId, authorName, text } = body;
  if (
    typeof placeId !== "number" ||
    typeof authorName !== "string" ||
    typeof text !== "string"
  ) {
    return NextResponse.json(
      { error: "placeId (number), authorName (string), text (string) required" },
      { status: 400 }
    );
  }

  const trimmedName = authorName.trim();
  const trimmedText = text.trim();
  if (!trimmedName || !trimmedText) {
    return NextResponse.json(
      { error: "authorName and text must be non-empty" },
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
    text: trimmedText,
  });
  return NextResponse.json(comment);
}

