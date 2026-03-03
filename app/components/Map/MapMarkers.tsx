"use client";

import React, { useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import type { PlaceListItem } from "@/app/types/place";
import type L from "leaflet";

const OFFICE_POSITION: [number, number] = [53.899928, 27.544233];
const OFFICE_ADDRESS = "ул. Коллекторная 3, г. Минск";

type MapMarkersProps = {
  places: PlaceListItem[];
  onPlaceSelect: (place: PlaceListItem) => void;
};

const MARKER_ICON_URLS = {
  icon: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetina: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadow: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
};

export function MapMarkers({ places, onPlaceSelect }: MapMarkersProps) {
  const [icon, setIcon] = useState<L.Icon | null>(null);
  const [officeIcon, setOfficeIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    import("leaflet").then((L) => {
      setIcon(
        new L.Icon({
          iconUrl: MARKER_ICON_URLS.icon,
          iconRetinaUrl: MARKER_ICON_URLS.iconRetina,
          shadowUrl: MARKER_ICON_URLS.shadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      );
      setOfficeIcon(
        L.divIcon({
          className: "office-marker-icon",
          html: `<div style="
            width: 32px;
            height: 32px;
            background: #f44173;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          " title="Офис"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        })
      );
    });
  }, []);

  if (!icon || !officeIcon) return null;

  return (
    <>
      <Marker position={OFFICE_POSITION} icon={officeIcon}>
        <Popup>
          <span className="font-semibold text-zinc-900">Офис</span>
          <p className="mt-1 text-sm text-zinc-600">{OFFICE_ADDRESS}</p>
        </Popup>
      </Marker>
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          icon={icon}
          eventHandlers={{
            click: () => onPlaceSelect(place),
          }}
        >
          <Popup>
            <button
              type="button"
              onClick={() => onPlaceSelect(place)}
              className="text-left font-medium text-zinc-900 hover:underline"
            >
              {place.name}
            </button>
            {place.address && (
              <p className="mt-1 text-sm text-zinc-600">{place.address}</p>
            )}
          </Popup>
        </Marker>
      ))}
    </>
  );
}
