"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { Button } from "@/app/components/UI/Button";
import { Input } from "@/app/components/UI/Input";
import type { Comment } from "@/app/types/comment";

const MAX_COMMENT_PHOTO_COUNT = 3;

type CommentFormProps = {
  placeId: number;
  onCommentAdded: (comment: Comment) => void;
};

export function CommentForm({ placeId, onCommentAdded }: CommentFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<
    Array<{ fileName: string; url: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previews = photos.map((photo) => ({
      fileName: photo.name,
      url: URL.createObjectURL(photo),
    }));

    setPhotoPreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [photos]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    if (photos.length + selectedFiles.length > MAX_COMMENT_PHOTO_COUNT) {
      setError(`Можно прикрепить не более ${MAX_COMMENT_PHOTO_COUNT} фото.`);
      return;
    }

    setError(null);
    setPhotos((prev) => [...prev, ...selectedFiles]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = authorName.trim();
    const trimmedText = text.trim();
    const numericRating =
      typeof rating === "number" && Number.isFinite(rating)
        ? Math.round(rating)
        : null;

    if (!trimmedName) {
      setError("Укажите имя.");
      return;
    }

    if (!trimmedText && (numericRating === null || numericRating < 1 || numericRating > 5)) {
      setError("Нужен либо текст комментария, либо рейтинг от 1 до 5.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("placeId", String(placeId));
      formData.append("authorName", trimmedName);
      formData.append("text", trimmedText);
      if (
        numericRating !== null &&
        numericRating >= 1 &&
        numericRating <= 5
      ) {
        formData.append("rating", String(numericRating));
      }
      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const res = await fetch("/api/comments", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить комментарий.");
        return;
      }
      onCommentAdded(data);
      setAuthorName("");
      setText("");
      setRating(null);
      setPhotos([]);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        label="Ваше имя"
        name="authorName"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Имя"
        disabled={loading}
        autoComplete="name"
      />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Оценка заведения
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const active =
              rating !== null && rating >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                disabled={loading}
                className={`text-xl transition-colors ${
                  active
                    ? "text-yellow-400"
                    : "text-zinc-300 dark:text-zinc-600"
                }`}
                aria-label={`Оценка ${star} из 5`}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="comment-photos"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Фотографии
        </label>
        <input
          id="comment-photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={loading}
          onChange={handlePhotoChange}
          className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-50 dark:text-zinc-300 dark:file:bg-zinc-200 dark:file:text-zinc-900 dark:hover:file:bg-zinc-300"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          До {MAX_COMMENT_PHOTO_COUNT} фото, JPG/PNG/WEBP, до 5 МБ каждое.
        </p>
        {photoPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photoPreviews.map((preview, index) => (
              <div
                key={`${preview.fileName}-${index}`}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
              >
                <Image
                  src={preview.url}
                  alt={preview.fileName}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  disabled={loading}
                  className="absolute right-1 top-1 rounded bg-black/70 px-1 text-xs text-white hover:bg-black/80"
                  aria-label="Удалить фото из списка"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="comment-text"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Ваш комментарий
        </label>
        <textarea
          id="comment-text"
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Текст комментария"
          disabled={loading}
          rows={3}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Отправка…" : "Отправить"}
      </Button>
    </form>
  );
}
