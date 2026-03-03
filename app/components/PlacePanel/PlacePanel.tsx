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
};

export function PlacePanel({ place, onClose }: PlacePanelProps) {
  const [lastAddedComment, setLastAddedComment] = useState<Comment | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {place.name}
        </h2>
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
      {place.address && (
        <p className="border-b border-zinc-200 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          {place.address}
        </p>
      )}
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
