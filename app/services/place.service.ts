import { prisma } from "@/lib/prisma";
import { deleteStoredCommentPhotoFiles } from "@/app/services/comment-photo-storage.service";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const MINSK_METRO_STATIONS = [
  { name: "Немига", lat: 53.90583, lon: 27.55389 },
  { name: "Площадь Франтишка Богушевича", lat: 53.89648, lon: 27.53804 },
  { name: "Площадь Ленина", lat: 53.8932, lon: 27.5478 },
  { name: "Фрунзенская", lat: 53.89638, lon: 27.53783 },
] as const;

const RADIUS_METERS = 800;

// Координаты офиса
const OFFICE = { lat: 53.899928, lon: 27.544233 } as const;


// Примерно 900м по прямой ≈ 10–12 минут пешком в одну сторону.
const OFFICE_RADIUS_METERS = 900;

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

function buildOverpassQuery(): string {
  const parts = MINSK_METRO_STATIONS.map(
    (s) =>
      `node["amenity"~"^(cafe|restaurant|fast_food|food_court)$"](around:${RADIUS_METERS},${s.lat},${s.lon});`
  ).join("\n  ");
  return `
[out:json][timeout:25];
(
  ${parts}
);
out body;
`.trim();
}

function formatAddress(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  const street = tags["addr:street"];
  const house = tags["addr:housenumber"];
  const city = tags["addr:city"];
  const parts = [street, house].filter(Boolean);
  if (parts.length === 0) return city ?? null;
  const line = parts.join(" ");
  return city ? `${line}, ${city}` : line;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  // Фильтр доступности.
  const R = 6371000; // радиус Земли в метрах
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export async function fetchPlacesFromOverpass(): Promise<OverpassElement[]> {
  const query = buildOverpassQuery();
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Overpass API error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as OverpassResponse;
  return data.elements ?? [];
}

export async function syncPlacesFromOverpass() {
  const seen = new Set<string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const elements = await fetchPlacesFromOverpass();

  for (const el of elements) {
    if (el.type !== "node" || el.lat == null || el.lon == null) continue;

  
    // Новый способ:
    // оставляем окружности станций как "генератор кандидатов", но дополнительно
    // отсекаем слишком дальние от офиса места по радиусу OFFICE_RADIUS_METERS.
    const distanceToOffice = haversineMeters(
      { lat: el.lat, lon: el.lon },
      OFFICE
    );
    if (distanceToOffice > OFFICE_RADIUS_METERS) {
      continue;
    }

    const externalId = `osm:${el.id}`;
    if (seen.has(externalId)) {
      skipped++;
      continue;
    }
    seen.add(externalId);

    const name = el.tags?.name ?? "Без названия";
    const address = formatAddress(el.tags);
    const latitude = el.lat;
    const longitude = el.lon;

    const existing = await prisma.place.findUnique({
      where: { externalId },
    });

    if (existing) {
      await prisma.place.update({
        where: { externalId },
        data: {
          name,
          address,
          description: el.tags?.amenity ?? null,
          latitude,
          longitude,
        },
      });
      updated++;
    } else {
      await prisma.place.create({
        data: {
          externalId,
          name,
          address,
          description: el.tags?.amenity ?? null,
          latitude,
          longitude,
        },
      });
      created++;
    }
  }

  return { created, updated, skipped };
}

export async function getPlaceByIdWithComments(id: number) {
  return prisma.place.findUnique({
    where: { id },
    include: {
      comments: {
        include: {
          photos: true,
        },
      },
    },
  });
}

export async function getPlacesForMap() {
  const places = await prisma.place.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      description: true,
      isManual: true,
      _count: { select: { comments: true } },
    },
  });

  const placeIds = places.map((p) => p.id);
  if (placeIds.length === 0) return places;

  const ratingAgg = await prisma.comment.groupBy({
    by: ["placeId"],
    where: {
      placeId: { in: placeIds },
      rating: { not: null },
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const ratingByPlaceId = new Map<
    number,
    { averageRating: number; ratingCount: number }
  >();
  for (const row of ratingAgg) {
    const avg = row._avg.rating;
    const count = row._count.rating;
    if (avg != null && count > 0) {
      ratingByPlaceId.set(row.placeId, {
        averageRating: Math.round(avg * 10) / 10,
        ratingCount: count,
      });
    }
  }

  return places.map((p) => {
    const rating = ratingByPlaceId.get(p.id);
    return {
      ...p,
      averageRating: rating?.averageRating ?? null,
      ratingCount: rating?.ratingCount ?? 0,
    };
  });
}

export async function deletePlaceById(id: number) {
  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      comments: {
        include: {
          photos: true,
        },
      },
    },
  });

  if (!place) {
    throw new Error("Place not found");
  }

  const filePaths = place.comments.flatMap((comment) =>
    comment.photos.map((photo) => photo.filePath)
  );

  await prisma.place.delete({
    where: { id },
  });

  await deleteStoredCommentPhotoFiles(filePaths);
}

export async function createManualPlace(params: {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
}) {
  const { name, address, latitude, longitude } = params;
  return prisma.place.create({
    data: {
      name,
      address: address ?? null,
      latitude,
      longitude,
      isManual: true,
    },
  });
}

