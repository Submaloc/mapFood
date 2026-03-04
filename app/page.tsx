"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { PlacePanel } from "@/app/components/PlacePanel/PlacePanel";
import type { PlaceListItem } from "@/app/types/place";

const Map = dynamic(() => import("@/app/components/Map/Map").then((m) => ({ default: m.Map })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
      <span className="text-zinc-500">Загрузка карты…</span>
    </div>
  ),
});

export default function Home() {
  const [places, setPlaces] = useState<PlaceListItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    try {
      const res = await fetch("/api/places");
      if (!res.ok) throw new Error("Не удалось загрузить места");
      const data = await res.json();
      setPlaces(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleDeletePlace = useCallback(
    async (placeId: number) => {
      try {
        const res = await fetch(`/api/places?id=${placeId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Не удалось удалить место");
        }
        setPlaces((prev) => prev.filter((p) => p.id !== placeId));
        setSelectedPlace(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка удаления места");
      }
    },
    []
  );

  const runSync = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sync-places", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncMessage([data.error, data.details].filter(Boolean).join(" — ") || "Ошибка синхронизации");
        return;
      }
      setSyncMessage(data.message ?? `Загружено: создано ${data.created}, обновлено ${data.updated}.`);
      await fetchPlaces();
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setSyncing(false);
    }
  }, [fetchPlaces]);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="rounded-2xl border border-zinc-200/40 bg-white/90 p-3 shadow-lg md:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <main className="relative h-[360px] rounded-xl bg-zinc-100 md:h-[520px]">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <span className="text-zinc-500">Загрузка карты…</span>
                </div>
              ) : error ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                  <p className="text-zinc-600">{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      fetchPlaces();
                    }}
                    className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
                  >
                    Повторить
                  </button>
                </div>
              ) : (
                <Map
                  places={places}
                  onPlaceSelect={setSelectedPlace}
                />
              )}
            </main>
            <aside className="flex min-h-[260px] flex-col rounded-xl bg-[#292d32] text-zinc-100">
              {selectedPlace ? (
                <div className="h-full overflow-hidden p-2 md:p-3">
                  <PlacePanel
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                    onDelete={handleDeletePlace}
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center text-zinc-200">
                  <p className="text-sm">
                    Выберите точку на карте, чтобы увидеть/добавить комментарии и рейтинги.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={runSync}
                      disabled={syncing}
                      className="rounded-lg bg-[#f44173] px-4 py-2 text-sm font-medium text-white hover:bg-[#e03464] disabled:opacity-50"
                    >
                      {syncing ? "Загрузка…" : "Загрузить заведения с карты"}
                    </button>
                    {syncMessage && (
                      <p className="text-xs text-zinc-200/80">{syncMessage}</p>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300">
                    Синхронизация для повторного обращения к API за местами на карте
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
