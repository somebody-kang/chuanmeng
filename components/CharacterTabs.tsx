"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/ToastProvider";
import CharacterPortrait from "@/components/CharacterPortrait";
import type { GalleryItem } from "@/lib/gallery";

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; nickname: string; avatar: string | null };
};

type MatchStat = {
  matchupId: number;
  roundName: string;
  groupLabel: string;
  votes: number;
  opponentVotes: number;
  percent: number;
  opponentName: string;
  opponentEmoji: string;
  status: string;
};

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

const TABS = [
  { key: "intro", label: "简介" },
  { key: "gallery", label: "图集" },
  { key: "comments", label: "评论" },
  { key: "stats", label: "得票" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function CharacterTabs({
  character,
  isLoggedIn,
}: {
  character: {
    id: number;
    slug: string;
    name: string;
    anime: string;
    group: string;
    groupLabel: string;
    description: string;
    emoji: string;
    color: string;
    totalVotes: number;
    gallery: GalleryItem[];
  };
  isLoggedIn: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("intro");
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: commentData, mutate: mutateComments } = useSWR<{ comments: Comment[] }>(
    tab === "comments" ? `/api/comments?characterId=${character.id}` : null,
    fetcher
  );

  const { data: statsData } = useSWR<{ stats: MatchStat[] }>(
    tab === "stats" ? `/api/characters/${character.slug}/stats` : null,
    fetcher
  );

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      toast("请先登录后再评论", "info");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "评论失败");
      setContent("");
      toast("评论已发布");
      mutateComments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "评论失败", "err");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-5">
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`group-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "intro" && (
        <div className="glass-panel anim-fade-up rounded-2xl p-6 leading-relaxed">
          <h2 className="font-display text-xl text-white">角色简介</h2>
          <p className="mt-3 text-[var(--text-secondary)]">{character.description}</p>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            作品：《{character.anime}》 · 分区：{character.groupLabel}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#fb7299] to-[#e85d84] px-5 py-2.5 text-sm font-semibold text-white"
          >
            前往对阵投票 →
          </Link>
        </div>
      )}

      {tab === "gallery" && (
        <div className="anim-fade-up grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {(character.gallery.length
            ? character.gallery
            : [
                {
                  id: "fallback",
                  caption: character.name,
                  emoji: character.emoji,
                  tint: character.color,
                  imageUrl: null as string | null,
                },
              ]
          ).map((g) => (
            <div key={g.id} className="glass-panel overflow-hidden rounded-2xl">
              <div className="aspect-[4/5]">
                <CharacterPortrait
                  name={g.caption}
                  emoji={g.emoji}
                  color={g.tint}
                  imageUrl={g.imageUrl}
                  sizeClass="text-6xl"
                />
              </div>
              <p className="px-3 py-2.5 text-sm text-[var(--text-secondary)]">{g.caption}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "comments" && (
        <div className="anim-fade-up space-y-4">
          <form onSubmit={submitComment} className="glass-panel rounded-2xl p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder={isLoggedIn ? "写下你的应援…" : "登录后可发表评论"}
              disabled={!isLoggedIn || submitting}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-black/20 px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] outline-none focus:border-[#fb7299]"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">{content.length}/200</span>
              <button
                type="submit"
                disabled={!isLoggedIn || submitting || !content.trim()}
                className="rounded-full bg-[#fb7299] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-45"
              >
                发布
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {(commentData?.comments ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">还没有评论，来抢沙发吧</p>
            ) : (
              commentData?.comments.map((c) => (
                <div key={c.id} className="glass-panel rounded-xl px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <strong className="text-sm text-[#ff9eb5]">
                      {c.user.nickname.replace(/^\[DEV\]\s*/, "")}
                    </strong>
                    <time className="text-[11px] text-[var(--text-muted)]">
                      {new Date(c.createdAt).toLocaleString("zh-CN")}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="anim-fade-up space-y-3">
          {(statsData?.stats ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-muted)]">暂无对阵得票数据</p>
          ) : (
            statsData?.stats.map((s) => (
              <div key={s.matchupId} className="glass-panel rounded-2xl p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="rounded-md bg-[#fb7299]/25 px-2 py-0.5 text-xs text-[#ff9eb5]">
                    {s.groupLabel}组 · {s.roundName}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    vs {s.opponentEmoji} {s.opponentName}
                  </span>
                </div>
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span className="text-[#ff9eb5]">
                    {character.name} {s.percent}%
                  </span>
                  <span className="text-[#5ecfff]">
                    {100 - s.percent}% {s.opponentName}
                  </span>
                </div>
                <div className="vote-bar">
                  <div
                    className="bg-gradient-to-r from-[#fb7299] to-[#ff9eb5]"
                    style={{ width: `${s.percent}%` }}
                  />
                  <div
                    className="bg-gradient-to-r from-[#5ecfff] to-[#00a1d6]"
                    style={{ width: `${100 - s.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {s.votes} : {s.opponentVotes}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
