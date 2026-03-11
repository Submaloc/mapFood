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
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [newPlaceCoords, setNewPlaceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);

  const filteredPlaces =
    minRating != null
      ? places.filter((p) => (p.averageRating ?? 0) >= minRating)
      : places;

  const fetchPlaces = useCallback(async (): Promise<PlaceListItem[]> => {
    try {
      const res = await fetch("/api/places");
      if (!res.ok) throw new Error("Не удалось загрузить места");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setPlaces(list);
      setError(null);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setPlaces([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    if (
      selectedPlace &&
      !filteredPlaces.some((p) => p.id === selectedPlace.id)
    ) {
      setSelectedPlace(null);
    }
  }, [minRating, filteredPlaces, selectedPlace]);

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
        const code = res.status || data.code;
        setSyncMessage(
          `Сервис временно недоступен${
            typeof code === "number" ? ` (код ${code})` : ""
          }.`
        );
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

  const handleMapClickForNewPlace = useCallback(
    (lat: number, lng: number) => {
      if (!isAddingPlace) return;
      setNewPlaceCoords({ lat, lng });
      setSelectedPlace(null);
    },
    [isAddingPlace]
  );

  const handleCreateManualPlace = useCallback(
    async (params: { name: string; address?: string }) => {
      if (!newPlaceCoords) return;
      const { name, address } = params;
      try {
        const res = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            address: address ?? undefined,
            latitude: newPlaceCoords.lat,
            longitude: newPlaceCoords.lng,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Не удалось создать место");
        }
        
        setPlaces((prev) => [
          ...prev,
          { ...data, averageRating: null, ratingCount: 0 },
        ]);
        setSelectedPlace({
          ...data,
          averageRating: null,
          ratingCount: 0,
        });
        setIsAddingPlace(false);
        setNewPlaceCoords(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка создания места");
      }
    },
    [newPlaceCoords]
  );

  const handleCancelCreateManualPlace = useCallback(() => {
    setIsAddingPlace(false);
    setNewPlaceCoords(null);
  }, []);

  const handlePlaceDataChanged = useCallback(async () => {
    const list = await fetchPlaces();
    setSelectedPlace((prev) =>
      prev ? list.find((p) => p.id === prev.id) ?? prev : null
    );
  }, [fetchPlaces]);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="rounded-2xl border border-zinc-200/40 bg-white/90 p-3 shadow-lg md:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <main className="relative h-[360px] rounded-xl bg-zinc-100 md:h-[520px]">
              <div className="pointer-events-none absolute left-14 top-3 z-[500] flex flex-col gap-2">
                <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs font-bold text-zinc-900">
                    Рейтинг от:
                  </span>
                  {/* Рейтинг с цифрами
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setMinRating((prev) => (prev === star ? null : star))
                      }
                      className={`rounded px-2 py-1 text-sm font-medium text-white shadow transition-colors ${
                        minRating === star
                          ? "bg-[#f44173]"
                          : "bg-zinc-600 hover:bg-zinc-500"
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                  */}
                  <div className="flex items-center gap-1 rounded bg-zinc-600 px-2 py-1 shadow">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = minRating !== null && minRating >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setMinRating(star)}
                          className={`text-xl leading-none transition-colors ${
                            active
                              ? "text-yellow-300"
                              : "text-zinc-300 hover:text-zinc-100"
                          }`}
                          aria-label={`Фильтр от ${star} звёзд`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMinRating(null)}
                    className={`rounded px-2 py-1 text-sm font-medium shadow transition-colors ${
                      minRating === null
                        ? "bg-zinc-800 text-white"
                        : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                    }`}
                  >
                    Все
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPlace((prev) => !prev);
                    setNewPlaceCoords(null);
                  }}
                  className={`pointer-events-auto flex h-9 w-fit items-center justify-center rounded-full px-3 text-sm font-medium text-white shadow-md transition-colors ${
                    isAddingPlace ? "bg-[#f44173]" : "bg-zinc-800"
                  }`}
                >
                  <span className="mr-1 text-lg leading-none">＋</span>
                  <span className="hidden sm:inline">
                    {isAddingPlace ? "Клик по карте…" : "Добавить место"}
                  </span>
                </button>
              </div>
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
                  places={filteredPlaces}
                  onPlaceSelect={setSelectedPlace}
                  onMapClickForNewPlace={handleMapClickForNewPlace}
                />
              )}
            </main>
            <aside className="flex min-h-[260px] flex-col rounded-xl bg-[#292d32] text-zinc-100">
              {newPlaceCoords && isAddingPlace ? (
                <div className="flex h-full flex-col justify-between p-4 text-left text-zinc-100">
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Новое место</h2>
                    <p className="text-sm text-zinc-300">
                      Вы выбрали точку на карте. Укажите необходимую информацию.
                    </p>
                    <ManualPlaceForm
                      onSubmit={handleCreateManualPlace}
                      onCancel={handleCancelCreateManualPlace}
                    />
                  </div>
                  <p className="mt-4 text-xs text-zinc-400">
                    Координаты: {newPlaceCoords.lat.toFixed(6)}, {newPlaceCoords.lng.toFixed(6)}
                  </p>
                </div>
              ) : selectedPlace ? (
                <div className="h-full overflow-hidden p-2 md:p-3">
                  <PlacePanel
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                    onDelete={handleDeletePlace}
                    onPlaceDataChanged={handlePlaceDataChanged}
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

type ManualPlaceFormProps = {
  onSubmit: (data: { name: string; address?: string }) => void;
  onCancel: () => void;
};

function ManualPlaceForm({ onSubmit, onCancel }: ManualPlaceFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    if (!trimmedName) {
      setError("Укажите название места.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: trimmedName,
        address: trimmedAddress || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 text-left">
        <label className="text-sm font-medium text-zinc-100">
          Название места
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Кафе рядом с офисом"
          disabled={submitting}
          className="w-full rounded-lg border border-zinc-600 bg-[#1f2328] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
      </div>
      <div className="flex flex-col gap-1 text-left">
        <label className="text-sm font-medium text-zinc-100">
          Адрес (необязательно)
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Улица, дом"
          disabled={submitting}
          className="w-full rounded-lg border border-zinc-600 bg-[#1f2328] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <div className="mt-1 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-[#f44173] px-3 py-2 text-sm font-medium text-white hover:bg-[#e03464] disabled:opacity-50"
        >
          {submitting ? "Сохранение…" : "Сохранить место"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-zinc-500 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-[#383d45]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
