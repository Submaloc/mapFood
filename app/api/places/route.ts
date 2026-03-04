import { NextRequest, NextResponse } from "next/server";
import {
  createManualPlace,
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

export async function POST(request: NextRequest) {
  let body: {
    name: string;
    address?: string | null;
    latitude: number;
    longitude: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { name, address, latitude, longitude } = body;

  if (
    typeof name !== "string" ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return NextResponse.json(
      {
        error:
          "name (string), latitude (number) и longitude (number) обязательны",
      },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();
  const trimmedAddress =
    typeof address === "string" ? address.trim() : undefined;

  if (!trimmedName) {
    return NextResponse.json(
      { error: "Название места не может быть пустым" },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: "Некорректные координаты" },
      { status: 400 }
    );
  }

  try {
    const place = await createManualPlace({
      name: trimmedName,
      address: trimmedAddress ?? null,
      latitude,
      longitude,
    });
    return NextResponse.json(place, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Failed to create place", details: message },
      { status: 500 }
    );
  }
}

