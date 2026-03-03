"use client";

import { useState } from "react";
import { Button } from "@/app/components/UI/Button";
import { Input } from "@/app/components/UI/Input";
import type { Comment } from "@/app/types/comment";

type CommentFormProps = {
  placeId: number;
  onCommentAdded: (comment: Comment) => void;
};

export function CommentForm({ placeId, onCommentAdded }: CommentFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = authorName.trim();
    const trimmedText = text.trim();
    if (!trimmedName || !trimmedText) {
      setError("Заполните имя и комментарий.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          authorName: trimmedName,
          text: trimmedText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить комментарий.");
        return;
      }
      onCommentAdded(data);
      setAuthorName("");
      setText("");
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
