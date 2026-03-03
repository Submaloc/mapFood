import { NextRequest, NextResponse } from "next/server";
import {
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

