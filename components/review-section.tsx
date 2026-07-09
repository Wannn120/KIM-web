"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/types";
import { reviews as defaultReviews } from "@/lib/mock-data";

export function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("minisoccer-reviews");
    if (stored) {
      try {
        const saved = JSON.parse(stored) as Review[];
        setReviews([...saved]);
      } catch {
        setReviews(defaultReviews);
      }
    }
  }, []);

  useEffect(() => {
    const rawUser = window.localStorage.getItem("minisoccer-user");
    if (rawUser) {
      try {
        const currentUser = JSON.parse(rawUser);
        if (currentUser.name) {
          setName(currentUser.name);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const saveReviews = (nextReviews: Review[]) => {
    setReviews(nextReviews);
    window.localStorage.setItem("minisoccer-reviews", JSON.stringify(nextReviews));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !comment.trim()) {
      setStatus("Please fill in your name and comment.");
      return;
    }

    const newReview: Review = {
      id: `review-${Date.now()}`,
      customerName: name,
      rating,
      comment,
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    };

    const nextReviews = [newReview, ...reviews];
    saveReviews(nextReviews);
    setComment("");
    setStatus("Review submitted successfully.");
  };

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 card-surface p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Add a review</p>
              <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Tell us about your game experience</h2>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">Name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    <span className="mb-2 block">Rating</span>
                    <select
                      value={rating}
                      onChange={(event) => setRating(Number(event.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>{`${value} stars`}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block">Comment</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none min-h-[180px]"
                    placeholder="Share your experience at Klaten International Minisoccer"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">Your review will appear on the homepage after submission.</p>
                  <button type="submit" className="btn-primary">
                    Submit review
                  </button>
                </div>
                {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
              </form>
            </div>
          </div>

          <div className="space-y-4">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="rounded-[2rem] border border-white/10 card-surface p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{review.customerName}</p>
                    <p className="text-sm text-slate-400">{review.date}</p>
                  </div>
                    <span className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-3 py-1 text-sm text-[color:var(--accent)]">
                      {review.rating} ★
                    </span>
                </div>
                <p className="mt-4 text-slate-300">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
