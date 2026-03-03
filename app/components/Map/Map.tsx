"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { PlaceListItem } from "@/app/types/place";
import { MapMarkers } from "./MapMarkers";

const MINSK_CENTER: [number, number] = [53.9, 27.55];
const ZOOM = 13;

const MARKER_ICON_URLS = {
  icon: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetina: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadow: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
};

type MapProps = {
  places: PlaceListItem[];
  onPlaceSelect: (place: PlaceListItem) => void;
};

export function Map({ places, onPlaceSelect }: MapProps) {
  const [iconsReady, setIconsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: MARKER_ICON_URLS.icon,
        iconRetinaUrl: MARKER_ICON_URLS.iconRetina,
        shadowUrl: MARKER_ICON_URLS.shadow,
      });
      setIconsReady(true);
    });
  }, []);

  if (!iconsReady) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        <span className="text-zinc-500">Загрузка карты…</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={MINSK_CENTER}
        zoom={ZOOM}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMarkers places={places} onPlaceSelect={onPlaceSelect} />
      </MapContainer>
    </div>
  );
}
