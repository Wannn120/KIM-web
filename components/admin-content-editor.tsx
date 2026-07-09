"use client";

import { useEffect, useState } from "react";
import { siteContent } from "@/lib/mock-data";

export function AdminContentEditor() {
  const [content, setContent] = useState(siteContent);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("minisoccer-site-content");
    if (stored) {
      try {
        setContent({ ...siteContent, ...JSON.parse(stored) });
      } catch {
        setContent(siteContent);
      }
    }
  }, []);

  const updateField = (key: keyof typeof siteContent, value: string) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    window.localStorage.setItem("minisoccer-site-content", JSON.stringify(content));
    setMessage("Content saved successfully.");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="rounded-[2rem] border border-white/10 card-surface p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Content editor</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Change hero text and images</h2>
      </div>
      <div className="grid gap-4">
        <label className="block text-sm text-[color:var(--muted)]">
          <span className="mb-2 block">Hero title</span>
          <input
            value={content.heroTitle}
            onChange={(event) => updateField("heroTitle", event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
          />
        </label>
        <label className="block text-sm text-[color:var(--muted)]">
          <span className="mb-2 block">Hero subtitle</span>
          <textarea
            value={content.heroSubtitle}
            onChange={(event) => updateField("heroSubtitle", event.target.value)}
            className="w-full rounded-3xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none min-h-[96px]"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Primary CTA text</span>
            <input
              value={content.ctaPrimary}
              onChange={(event) => updateField("ctaPrimary", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Secondary CTA text</span>
            <input
              value={content.ctaSecondary}
              onChange={(event) => updateField("ctaSecondary", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
        </div>
        <label className="block text-sm text-[color:var(--muted)]">
          <span className="mb-2 block">Hero background image URL</span>
          <input
            value={content.backgroundImageUrl}
            onChange={(event) => updateField("backgroundImageUrl", event.target.value)}
            className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Contact email</span>
            <input
              value={content.contactEmail}
              onChange={(event) => updateField("contactEmail", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
          <label className="block text-sm text-[color:var(--muted)]">
            <span className="mb-2 block">Contact phone</span>
            <input
              value={content.contactPhone}
              onChange={(event) => updateField("contactPhone", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--foreground)] outline-none"
            />
          </label>
        </div>
        <button type="button" onClick={save} className="btn-primary">
          Save website content
        </button>
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      </div>
    </div>
  );
}
