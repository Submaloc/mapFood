"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/app/types/comment";

type CommentsListProps = {
  placeId: number;
  newComment?: Comment | null;
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

export function CommentsList({ placeId, newComment }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <ul className="flex flex-col gap-3">
      {comments.map((c) => (
        <li
          key={c.id}
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {c.authorName}
            </p>
            {typeof c.rating === "number" && c.rating >= 1 && c.rating <= 5 && (
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
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {formatDate(c.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
