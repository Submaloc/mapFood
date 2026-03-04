import { NextRequest, NextResponse } from "next/server";
import {
  deletePlaceById,
  getPlaceByIdWithComments,
  getPlacesForMap,
} from "@/app/services/place.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const placeId = parseInt(id, 10);
    if (Number.isNaN(placeId)) {
      return NextResponse.json(
        { error: "Invalid place id" },
        { status: 400 }
      );
    }
    const place = await getPlaceByIdWithComments(placeId);
    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }
    return NextResponse.json(place);
  }

  const places = await getPlacesForMap();
  return NextResponse.json(places);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Place id is required" },
      { status: 400 }
    );
  }

  const placeId = parseInt(id, 10);
  if (Number.isNaN(placeId)) {
    return NextResponse.json(
      { error: "Invalid place id" },
      { status: 400 }
    );
  }

  try {
    await deletePlaceById(placeId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Failed to delete place", details: message },
      { status: 500 }
    );
  }
}

