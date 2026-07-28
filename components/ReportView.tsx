"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import CharacterPortrait from "@/components/CharacterPortrait";
import { formatDateTime, PHASE_LABEL, type MatchPhase } from "@/lib/match-phase";

type CharSide = {
  id: number;
  slug: string;
  name: string;
  anime: string;
  emoji: string;
  color: string;
  imageUrl: string | null;
  votes: number;
  percent: number;
};

type Matchup = {
  id: number;
  groupLabel: string;
  mode: "duel" | "group";
  voteLimit: number;
  roundName: string;
  phase: MatchPhase;
  startAt: string | null;
  endAt: string | null;
  totalVotes: number;
  winnerId: number | null;
  winners: Array<{ id: number; name: string; emoji: string }>;
  characters: CharSide[];
  characterA: CharSide | null;
  characterB: CharSide | null;
  participantCount: number;
};

type ReportData = {
  summary: {
    ended: number;
    live: number;
    upcoming: number;
    totalVotes: number;
  };
  leaderboard: Array<{ id: number; name: string; emoji: string; wins: number }>;
  matchups: Matchup[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReportView() {
  const { data, isLoading } = useSWR<ReportData>("/api/bracket/report", fetcher, {
    refreshInterval: 15000,
  });
  const [group, setGroup] = useState("all");
  const [filter, setFilter] = useState<"all" | "ended" | "live">("all");

  const groups = useMemo(() => {
    const set = new Set((data?.matchups ?? []).map((m) => m.groupLabel));
    return [...set].sort();
  }, [data]);

  const list = useMemo(() => {
    let rows = data?.matchups ?? [];
    if (group !== "all") rows = rows.filter((m) => m.groupLabel === group);
    if (filter === "ended") rows = rows.filter((m) => m.phase === "ended");
    if (filter === "live") rows = rows.filter((m) => m.phase === "live");
    return rows;
  }, [data, group, filter]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  const summary = data?.summary ?? { ended: 0, live: 0, upcoming: 0, totalVotes: 0 };
  const leaderboard = data?.leaderboard ?? [];

  return (
    <div className="space-y-8">
      <section className="report-summary grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "已结束", value: summary.ended, tone: "ended" },
          { label: "进行中", value: summary.live, tone: "live" },
          { label: "未开始", value: summary.upcoming, tone: "upcoming" },
          { label: "累计票数", value: summary.totalVotes, tone: "votes" },
        ].map((s) => (
          <div key={s.label} className={`report-stat report-stat-${s.tone}`}>
            <p className="text-xs tracking-wider text-white/70">{s.label}</p>
            <p className="mt-1 font-display text-3xl text-white md:text-4xl">{s.value}</p>
          </div>
        ))}
      </section>

      {leaderboard.length > 0 && (
        <section>
          <div className="mb-3">
            <h2 className="font-display text-xl text-white">胜者榜</h2>
            <p className="text-xs text-[var(--text-muted)]">按已结束对阵的胜场统计</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {leaderboard.slice(0, 8).map((w, i) => (
              <div
                key={w.id}
                className="glass-panel anim-fade-up flex min-w-[120px] flex-col items-center rounded-2xl px-4 py-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="mb-2 text-xs text-[#ffd54f]">#{i + 1}</span>
                <span className="text-3xl">{w.emoji}</span>
                <span className="mt-2 max-w-[100px] truncate text-sm font-semibold text-white">
                  {w.name}
                </span>
                <span className="mt-1 text-xs text-[#ff9eb5]">{w.wins} 胜</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-white">对阵战报</h2>
            <p className="text-xs text-[var(--text-muted)]">历史得票与胜负一览</p>
          </div>
          <div className="flex gap-2">
            {(
              [
                ["all", "全部"],
                ["ended", "已结束"],
                ["live", "进行中"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`group-tab ${filter === k ? "active" : ""}`}
                onClick={() => setFilter(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            className={`group-tab ${group === "all" ? "active" : ""}`}
            onClick={() => setGroup("all")}
          >
            全部
          </button>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              className={`group-tab ${group === g ? "active" : ""}`}
              onClick={() => setGroup(g)}
            >
              {g}组
            </button>
          ))}
        </div>

        {!list.length ? (
          <div className="py-16 text-center font-display text-2xl text-[var(--text-muted)]">
            暂无比赛信息
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {list.map((m, idx) =>
              m.mode === "group" ? (
                <GroupReportCard key={m.id} matchup={m} delay={idx * 40} />
              ) : (
                <DuelReportCard key={m.id} matchup={m} delay={idx * 40} />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ReportMeta({ m }: { m: Matchup }) {
  const winnerText =
    m.phase === "ended" && m.winners.length
      ? ` · ${m.winners.map((w) => w.name).join("、")} 胜`
      : "";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-gradient-to-r from-[#fb7299]/15 via-transparent to-[#00a1d6]/10 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-[#fb7299] px-2.5 py-0.5 text-[11px] font-bold text-white">
          {m.groupLabel}组
        </span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
          {m.mode === "group" ? `小组赛 · ${m.participantCount}选${m.voteLimit}` : "决斗赛"}
        </span>
        <span className="font-display text-sm tracking-wider text-white">{m.roundName}</span>
      </div>
      <span
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          m.phase === "ended"
            ? "bg-[#ffd54f]/20 text-[#ffd54f]"
            : m.phase === "live"
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-sky-500/20 text-sky-300"
        }`}
      >
        {PHASE_LABEL[m.phase]}
        {winnerText}
      </span>
    </div>
  );
}

function DuelReportCard({ matchup: m, delay }: { matchup: Matchup; delay: number }) {
  const a = m.characterA;
  const b = m.characterB;
  if (!a || !b) return null;
  const aWin = m.winners.some((w) => w.id === a.id);
  const bWin = m.winners.some((w) => w.id === b.id);

  return (
    <article
      className="anim-fade-up glass-panel overflow-hidden rounded-2xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <ReportMeta m={m} />
      <div className="grid items-center gap-3 p-4 md:grid-cols-[1fr_auto_1fr] md:px-6 md:py-5">
        <ReportSide char={a} win={aWin} accent="pink" />
        <div className="flex flex-col items-center gap-1 py-2">
          <div className="vs-badge !h-12 !w-12 !text-base">VS</div>
          <p className="text-xs text-[var(--text-muted)]">{m.totalVotes} 票</p>
        </div>
        <ReportSide char={b} win={bWin} accent="blue" />
      </div>
      <div className="px-4 pb-2 md:px-6">
        <div className="mb-1.5 flex justify-between text-xs font-semibold">
          <span className="text-[#ff9eb5]">
            {a.votes} · {a.percent}%
          </span>
          <span className="text-[#5ecfff]">
            {b.percent}% · {b.votes}
          </span>
        </div>
        <div className="vote-bar h-3">
          <div
            className="bg-gradient-to-r from-[#fb7299] to-[#ff9eb5]"
            style={{ width: `${a.percent}%` }}
          />
          <div
            className="bg-gradient-to-r from-[#5ecfff] to-[#00a1d6]"
            style={{ width: `${b.percent}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 text-[11px] text-[var(--text-muted)] md:px-6">
        <span>
          {formatDateTime(m.startAt)} — {formatDateTime(m.endAt)}
        </span>
        <Link href="/" className="text-[#ff9eb5] hover:underline">
          返回对阵 →
        </Link>
      </div>
    </article>
  );
}

function GroupReportCard({ matchup: m, delay }: { matchup: Matchup; delay: number }) {
  const ranked = [...m.characters].sort((a, b) => b.votes - a.votes || a.id - b.id);
  return (
    <article
      className="anim-fade-up glass-panel overflow-hidden rounded-2xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <ReportMeta m={m} />
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 md:p-5">
        {ranked.map((char, i) => {
          const win = m.winners.some((w) => w.id === char.id);
          return (
            <Link
              key={char.id}
              href={`/characters/${char.slug}`}
              className={`rounded-xl border p-2 text-center transition hover:border-[#fb7299]/50 ${
                win ? "border-[#ffd54f]/60 bg-[#ffd54f]/10" : "border-[var(--border)] bg-black/20"
              }`}
            >
              <p className="text-[10px] text-[var(--text-muted)]">#{i + 1}</p>
              <div className="relative mx-auto mt-1 aspect-square w-full max-w-[100px] overflow-hidden rounded-lg">
                <CharacterPortrait
                  name={char.name}
                  emoji={char.emoji}
                  color={char.color}
                  imageUrl={char.imageUrl}
                  className="absolute inset-0"
                />
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-white">{char.name}</p>
              <p className="font-display text-base text-[#ff6b8a]">{char.votes.toLocaleString()} 票</p>
              {win && <p className="text-[10px] font-bold text-[#ffd54f]">胜者</p>}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 text-[11px] text-[var(--text-muted)] md:px-6">
        <span>
          {formatDateTime(m.startAt)} — {formatDateTime(m.endAt)} · 总票 {m.totalVotes}
        </span>
        <Link href="/" className="text-[#ff9eb5] hover:underline">
          返回对阵 →
        </Link>
      </div>
    </article>
  );
}

function ReportSide({
  char,
  win,
  accent,
}: {
  char: CharSide;
  win: boolean;
  accent: "pink" | "blue";
}) {
  return (
    <div className={`flex items-center gap-3 ${accent === "blue" ? "md:flex-row-reverse" : ""}`}>
      <Link
        href={`/characters/${char.slug}`}
        className={`relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl md:h-28 md:w-20 ${
          win ? "ring-2 ring-[#ffd54f]" : ""
        }`}
      >
        {win && (
          <span className="absolute inset-x-0 top-0 z-[1] bg-[#ffd54f] text-center text-[10px] font-bold text-[#3a2a00]">
            WIN
          </span>
        )}
        <CharacterPortrait
          name={char.name}
          emoji={char.emoji}
          color={char.color}
          imageUrl={char.imageUrl}
          className="absolute inset-0"
        />
      </Link>
      <div className={accent === "blue" ? "text-right" : "text-left"}>
        <p className="font-semibold text-white">{char.name}</p>
        <p className="text-[11px] text-[var(--text-muted)]">《{char.anime}》</p>
        <p
          className={`mt-1 font-display text-lg ${
            accent === "pink" ? "text-[#ff9eb5]" : "text-[#5ecfff]"
          }`}
        >
          {char.votes}
        </p>
      </div>
    </div>
  );
}
