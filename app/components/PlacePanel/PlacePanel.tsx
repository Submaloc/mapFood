"use client";

import { useState } from "react";
import { CommentForm } from "./CommentForm";
import { CommentsList } from "./CommentsList";
import type { Comment } from "@/app/types/comment";
type PlaceForPanel = {
  id: number;
  name: string;
  address?: string | null;
};

type PlacePanelProps = {
  place: PlaceForPanel;
  onClose?: () => void;
  onDelete?: (placeId: number) => void;
};

export function PlacePanel({ place, onClose, onDelete }: PlacePanelProps) {
  const [lastAddedComment, setLastAddedComment] = useState<Comment | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {place.name}
          </h2>
          {place.address && (
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {place.address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Удалить это место и все связанные комментарии/рейтинги?"
                  )
                ) {
                  onDelete(place.id);
                }
              }}
              className="rounded-lg bg-[#f44173] px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#e03464]"
            >
              Удалить
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Закрыть"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Комментарии
          </h3>
          <CommentsList
            placeId={place.id}
            newComment={lastAddedComment}
          />
        </section>
        <section>
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Оставить комментарий
          </h3>
          <CommentForm
            placeId={place.id}
            onCommentAdded={setLastAddedComment}
          />
        </section>
      </div>
    </div>
  );
}
