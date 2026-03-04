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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#3a3f46]/40 bg-[#292d32] shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-[#3a3f46]/40 p-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-lg font-semibold text-white">
            {place.name}
          </h2>
          {place.address && (
            <p className="mt-0.5 truncate text-xs text-zinc-300">
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
              className="rounded p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              aria-label="Закрыть"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <section className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-zinc-100">
            Комментарии
          </h3>
          <CommentsList
            placeId={place.id}
            newComment={lastAddedComment}
          />
        </section>
        <section>
          <h3 className="mb-2 text-sm font-medium text-zinc-100">
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
