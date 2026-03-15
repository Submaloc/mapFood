"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Comment } from "@/app/types/comment";

type CommentsListProps = {
  placeId: number;
  newComment?: Comment | null;
  onCommentDeleted?: () => void;
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function CommentsList({
  placeId,
  newComment,
  onCommentDeleted,
}: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/comments?placeId=${placeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить комментарии");
        return res.json();
      })
      .then((data: Comment[]) => {
        if (!cancelled) setComments(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  useEffect(() => {
    if (newComment && newComment.placeId === placeId) {
      setComments((prev) => [newComment, ...prev]);
    }
  }, [newComment, placeId]);

  async function handleDelete(commentId: number) {
    if (!window.confirm("Удалить этот комментарий?")) return;
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Не удалось удалить");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentDeleted?.();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Загрузка комментариев…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    );
  }
  if (comments.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Пока нет комментариев. Оставьте первый.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {comments.map((c) => (
          <li
            key={c.id}
            className="relative rounded-lg border border-zinc-200 bg-zinc-50 p-3 pr-8 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <button
              type="button"
              onClick={() => handleDelete(c.id)}
              disabled={deletingId === c.id}
              className="absolute right-2 top-2 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              aria-label="Удалить комментарий"
            >
              ×
            </button>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {c.authorName}
              </p>
              {typeof c.rating === "number" &&
                c.rating >= 1 &&
                c.rating <= 5 && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-yellow-400">
                      {"★".repeat(c.rating)}
                      {"☆".repeat(5 - c.rating)}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {c.rating.toFixed(1).replace(".0", "")}/5
                    </span>
                  </div>
                )}
            </div>
            {c.text && (
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {c.text}
              </p>
            )}
            {c.photos && c.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() =>
                      setSelectedPhoto({
                        url: photo.url,
                        fileName: photo.fileName,
                      })
                    }
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-900"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.fileName}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(c.createdAt)}
            </p>
          </li>
        ))}
      </ul>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-2 top-2 z-10 rounded bg-black/70 px-2 py-1 text-sm text-white hover:bg-black/80"
              aria-label="Закрыть просмотр фото"
            >
              ×
            </button>
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.fileName}
              width={1200}
              height={900}
              unoptimized
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
