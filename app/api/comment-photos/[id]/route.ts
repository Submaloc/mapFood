import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readStoredCommentPhoto } from "@/app/services/comment-photo-storage.service";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const photoId = parseInt(id, 10);

  if (Number.isNaN(photoId)) {
    return NextResponse.json({ error: "Invalid photo id" }, { status: 400 });
  }

  const photo = await prisma.commentPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  try {
    const file = await readStoredCommentPhoto(photo.filePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Stored photo file not found" },
      { status: 404 }
    );
  }
}

