"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/types";
import { reviews as defaultReviews } from "@/lib/mock-data";

export function AdminReviewManager() {
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftComment, setDraftComment] = useState("");
  const [draftRating, setDraftRating] = useState(5);

  useEffect(() => {
    const stored = window.localStorage.getItem("minisoccer-reviews");
    if (stored) {
      try {
        setReviews(JSON.parse(stored));
      } catch {
        setReviews(defaultReviews);
      }
    }
  }, []);

  const save = (nextReviews: Review[]) => {
    setReviews(nextReviews);
    window.localStorage.setItem("minisoccer-reviews", JSON.stringify(nextReviews));
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setDraftComment(review.comment);
    setDraftRating(review.rating);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftComment("");
    setDraftRating(5);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const nextReviews = reviews.map((review) => {
      if (review.id !== editingId) return review;
      return { ...review, comment: draftComment, rating: draftRating };
    });
    save(nextReviews);
    cancelEdit();
  };

  const deleteReview = (id: string) => {
    const nextReviews = reviews.filter((review) => review.id !== id);
    save(nextReviews);
  };

  return (
    <div className="rounded-[2rem] border border-white/10 card-surface p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Review management</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Edit or remove customer ratings</h2>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-400">No reviews available.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">{review.customerName}</p>
                  <p className="text-sm text-slate-400">{review.date}</p>
                  <p className="text-sm text-[color:var(--accent)]">{review.rating} ★</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(review)} className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-3 py-2 text-sm text-[color:var(--accent)] transition hover:bg-[color:rgba(16,185,129,0.08)]">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReview(review.id)}
                    className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-4 text-slate-300">{review.comment}</p>
              {editingId === review.id ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 card-surface p-4">
                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">Rating</span>
                    <select
                      value={draftRating}
                      onChange={(event) => setDraftRating(Number(event.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>{`${value} stars`}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">Comment</span>
                    <textarea
                      value={draftComment}
                      onChange={(event) => setDraftComment(event.target.value)}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none min-h-[100px]"
                    />
                  </label>
                  <div className="flex gap-3">
                    <button type="button" onClick={saveEdit} className="btn-primary">
                      Save review
                    </button>
                    <button type="button" onClick={cancelEdit} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
