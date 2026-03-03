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
    <div className="flex h-dvh w-full flex-col md:flex-row">
      <main className="relative flex-1 min-h-[50vh] md:min-h-full">
        {loading ? (
          <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            <span className="text-zinc-500">Загрузка карты…</span>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-zinc-100 p-4 text-center dark:bg-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
            <button
              type="button"
              onClick={() => { setLoading(true); fetchPlaces(); }}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
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
      <aside className="w-full border-t border-zinc-200 bg-white md:w-[400px] md:min-w-[320px] md:border-t-0 md:border-l dark:border-zinc-700 dark:bg-zinc-900">
        {selectedPlace ? (
          <div className="h-full overflow-hidden p-2 md:p-4">
            <PlacePanel
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center text-zinc-500 dark:text-zinc-400">
            <p className="text-sm">Выберите точку на карте, чтобы увидеть информацию и комментарии.</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={runSync}
                disabled={syncing}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {syncing ? "Загрузка…" : "Загрузить заведения с карты"}
              </button>
              {syncMessage && (
                <p className="text-xs text-zinc-600 dark:text-zinc-300">{syncMessage}</p>
              )}
            </div>
            <p className="text-xs">
              Данные берутся из БД. Кнопка подтягивает заведения (кафе, рестораны) из OpenStreetMap вокруг станций метро.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
