"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/ToastProvider";
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
  userVoted?: boolean;
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
  canVote: boolean;
  userVoteCount: number;
  userRemainingInGroup: number;
  participantCount: number;
  characters: CharSide[];
  characterA: CharSide | null;
  characterB: CharSide | null;
};

type BracketData = {
  groups: string[];
  matchups: Matchup[];
  activeCount: number;
  phase: MatchPhase;
  counts: { live: number; upcoming: number; ended: number };
};

type PendingVote = {
  matchupId: number;
  characterId: number;
  charName: string;
  emoji: string;
  color: string;
  imageUrl: string | null;
  groupLabel: string;
  mode: "duel" | "group";
};

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

const PHASES: MatchPhase[] = ["live", "upcoming", "ended"];

export default function BracketView({
  initialGroup,
  isLoggedIn,
  hasRemainingVotes,
}: {
  initialGroup: string;
  isLoggedIn: boolean;
  hasRemainingVotes: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [group, setGroup] = useState(initialGroup);
  const [phase, setPhase] = useState<MatchPhase>("live");
  const [sortByVotes, setSortByVotes] = useState(false);
  const [voting, setVoting] = useState(false);
  const [pending, setPending] = useState<PendingVote | null>(null);

  const { data, mutate, isLoading } = useSWR<BracketData>(
    `/api/bracket/active?group=${group}&phase=${phase}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const requestVote = useCallback(
    (matchup: Matchup, char: CharSide) => {
      if (!matchup.canVote) {
        toast(
          matchup.phase === "upcoming" ? "该对阵尚未开始" : "该对阵已结束，不可再投票",
          "err"
        );
        return;
      }
      if (char.userVoted) {
        toast("已为该角色投过票", "info");
        return;
      }
      if (matchup.userRemainingInGroup <= 0) {
        toast(
          matchup.mode === "duel"
            ? "该对阵已投过票"
            : `本组最多可选 ${matchup.voteLimit} 名角色`,
          "err"
        );
        return;
      }
      if (!isLoggedIn) {
        router.push("/login?next=/");
        return;
      }
      if (!hasRemainingVotes) {
        toast("剩余票数不足", "err");
        return;
      }
      setPending({
        matchupId: matchup.id,
        characterId: char.id,
        charName: char.name,
        emoji: char.emoji,
        color: char.color,
        imageUrl: char.imageUrl,
        groupLabel: matchup.groupLabel,
        mode: matchup.mode,
      });
    },
    [isLoggedIn, hasRemainingVotes, router, toast]
  );

  const confirmVote = useCallback(async () => {
    if (!pending) return;
    setVoting(true);
    try {
      const res = await fetch("/api/vote/intent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchupId: pending.matchupId,
          characterId: pending.characterId,
          votes: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "投票失败");
      const groupHint =
        typeof json.groupRemaining === "number"
          ? ` · 本组还可选 ${json.groupRemaining}`
          : "";
      toast(`已为「${pending.charName}」投出 1 票 · 剩余 ${json.remaining}${groupHint}`);
      setPending(null);
      mutate();
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "投票失败", "err");
    } finally {
      setVoting(false);
    }
  }, [pending, mutate, router, toast]);

  const groups = data?.groups ?? [];
  const matchups = data?.matchups ?? [];
  const counts = data?.counts ?? { live: 0, upcoming: 0, ended: 0 };

  const emptyHint =
    phase === "live"
      ? "当前没有进行中的对阵"
      : phase === "upcoming"
        ? "暂无未开始的对阵"
        : "暂无已结束的对阵";

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {PHASES.map((p) => (
          <button
            key={p}
            type="button"
            className={`phase-tab ${phase === p ? "active" : ""}`}
            data-tip={`${PHASE_LABEL[p]}的对阵`}
            onClick={() => setPhase(p)}
          >
            <span>{PHASE_LABEL[p]}</span>
            <span className="phase-count">{counts[p]}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            className={`group-tab ${group === "all" ? "active" : ""}`}
            data-tip="显示全部小组对阵"
            onClick={() => setGroup("all")}
          >
            全部
          </button>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              className={`group-tab ${group === g ? "active" : ""}`}
              data-tip={`只看 ${g} 组对阵`}
              onClick={() => setGroup(g)}
            >
              {g}组
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`group-tab ${sortByVotes ? "active" : ""}`}
          data-tip="按票数排序小组赛角色"
          onClick={() => setSortByVotes((v) => !v)}
        >
          票数排序
        </button>
      </div>

      {isLoading && !data ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-64 w-full" />
          ))}
        </div>
      ) : !matchups.length ? (
        <div className="py-20 text-center font-display text-2xl text-[var(--text-muted)]">
          {emptyHint}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {matchups.map((m, idx) =>
            m.mode === "group" ? (
              <GroupStageCard
                key={m.id}
                matchup={m}
                delay={idx * 60}
                sortByVotes={sortByVotes}
                isLoggedIn={isLoggedIn}
                hasRemainingVotes={hasRemainingVotes}
                voting={voting}
                onVote={requestVote}
              />
            ) : (
              <DuelCard
                key={m.id}
                matchup={m}
                delay={idx * 60}
                isLoggedIn={isLoggedIn}
                hasRemainingVotes={hasRemainingVotes}
                voting={voting}
                onVote={requestVote}
              />
            )
          )}
        </div>
      )}

      {pending && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vote-confirm-title"
        >
          <div className="glass-panel anim-fade-up w-full max-w-sm rounded-2xl p-6 text-center">
            <p className="text-xs tracking-widest text-[#ff9eb5]">确认投票</p>
            <h3 id="vote-confirm-title" className="mt-1 font-display text-2xl text-white">
              投给「{pending.charName}」？
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {pending.groupLabel}组
              {pending.mode === "group" ? " · 小组赛" : " · 决斗赛"}
              · 确认后不可撤销
            </p>
            <div className="mx-auto mt-5 h-36 w-28 overflow-hidden rounded-xl">
              <CharacterPortrait
                name={pending.charName}
                emoji={pending.emoji}
                color={pending.color}
                imageUrl={pending.imageUrl}
                sizeClass="text-5xl"
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={voting}
                onClick={() => setPending(null)}
                className="rounded-xl border border-[var(--border)] py-2.5 text-sm text-[var(--text-secondary)] hover:text-white disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={voting}
                onClick={confirmVote}
                className="rounded-xl bg-gradient-to-r from-[#fb7299] to-[#e85d84] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {voting ? "提交中…" : "确认投票"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MatchHeader({ m }: { m: Matchup }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-2.5 text-xs text-[var(--text-secondary)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#fb7299] px-2.5 py-0.5 text-[11px] font-bold text-white">
            {m.groupLabel}组
          </span>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
            {m.mode === "group" ? `小组赛 · ${m.participantCount}选${m.voteLimit}` : "决斗赛"}
          </span>
        </div>
        <span className="font-display tracking-wider">{m.roundName}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            m.phase === "live"
              ? "bg-emerald-500/20 text-emerald-300"
              : m.phase === "upcoming"
                ? "bg-sky-500/20 text-sky-300"
                : "bg-white/10 text-[var(--text-muted)]"
          }`}
        >
          {PHASE_LABEL[m.phase]}
        </span>
      </div>
      <div className="border-b border-[var(--border)] px-4 py-1.5 text-[11px] text-[var(--text-muted)] md:px-6">
        {formatDateTime(m.startAt)} — {formatDateTime(m.endAt)}
        <span className="ml-2">· 总票 {m.totalVotes}</span>
        {m.phase === "live" && (
          <span className="ml-2 text-[#ff9eb5]">
            · 本组还可投 {m.userRemainingInGroup}/{m.voteLimit}
          </span>
        )}
        {m.phase === "ended" && m.winners.length > 0 && (
          <span className="ml-2 text-[#ffd54f]">
            · 胜者 {m.winners.map((w) => w.name).join("、")}
          </span>
        )}
      </div>
    </>
  );
}

function DuelCard({
  matchup: m,
  delay,
  isLoggedIn,
  hasRemainingVotes,
  voting,
  onVote,
}: {
  matchup: Matchup;
  delay: number;
  isLoggedIn: boolean;
  hasRemainingVotes: boolean;
  voting: boolean;
  onVote: (matchup: Matchup, char: CharSide) => void;
}) {
  const a = m.characterA;
  const b = m.characterB;
  if (!a || !b) return null;

  const aWin = m.winnerId === a.id || (m.phase === "live" && a.votes > b.votes && m.totalVotes > 0);
  const bWin = m.winnerId === b.id || (m.phase === "live" && b.votes > a.votes && m.totalVotes > 0);
  const canVoteNow =
    m.canVote && m.userRemainingInGroup > 0 && (!isLoggedIn || hasRemainingVotes);
  const voteDisabled = voting || !canVoteNow;
  const tipBase = !m.canVote
    ? m.phase === "upcoming"
      ? `未开始 · ${formatDateTime(m.startAt)} 开放`
      : "已结束，不可投票"
    : m.userRemainingInGroup <= 0
      ? "该对阵已投过票"
      : !isLoggedIn
        ? "登录后可投票"
        : !hasRemainingVotes
          ? "剩余票数不足"
          : null;

  return (
    <article
      className="anim-fade-up glass-panel overflow-hidden rounded-2xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <MatchHeader m={m} />

      <div className="grid items-stretch gap-3 p-4 md:grid-cols-[1fr_auto_1fr] md:gap-2 md:px-6 md:py-5">
        <Side char={a} winner={aWin} accent="pink" crowned={m.phase === "ended" && m.winnerId === a.id} />
        <div className="flex flex-col items-center justify-center gap-2 py-1">
          <div className="vs-badge">VS</div>
          <span className="text-[11px] text-[var(--text-muted)]">{m.totalVotes} 票</span>
        </div>
        <Side char={b} winner={bWin} accent="blue" crowned={m.phase === "ended" && m.winnerId === b.id} />
      </div>

      <div className="px-4 pb-3 md:px-6">
        <div className="mb-1.5 flex justify-between text-xs font-semibold">
          <span className="text-[#ff9eb5]">
            {a.name} {a.percent}%
          </span>
          <span className="text-[#5ecfff]">
            {b.percent}% {b.name}
          </span>
        </div>
        <div className="vote-bar">
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

      {m.phase === "live" ? (
        <div className="grid gap-2 px-4 pb-4 md:grid-cols-2 md:px-6">
          <button
            type="button"
            disabled={voteDisabled || !!a.userVoted}
            data-tip={a.userVoted ? "已投票" : tipBase ?? `确认后为「${a.name}」投 1 票`}
            onClick={() => onVote(m, a)}
            className="rounded-xl border border-[#fb7299]/45 bg-[#fb7299]/15 py-2.5 text-sm font-semibold text-[#ff9eb5] transition hover:bg-[#fb7299] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {a.userVoted ? "已投票" : `投给 ${a.name}`}
          </button>
          <button
            type="button"
            disabled={voteDisabled || !!b.userVoted}
            data-tip={b.userVoted ? "已投票" : tipBase ?? `确认后为「${b.name}」投 1 票`}
            onClick={() => onVote(m, b)}
            className="rounded-xl border border-[#00a1d6]/45 bg-[#00a1d6]/12 py-2.5 text-sm font-semibold text-[#5ecfff] transition hover:bg-[#00a1d6] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {b.userVoted ? "已投票" : `投给 ${b.name}`}
          </button>
        </div>
      ) : (
        <div className="px-4 pb-4 text-center text-xs text-[var(--text-muted)] md:px-6">
          {m.phase === "upcoming"
            ? `投票将于 ${formatDateTime(m.startAt)} 开始`
            : "本场投票已结束 · 可前往战报查看更多统计"}
        </div>
      )}
    </article>
  );
}

function GroupStageCard({
  matchup: m,
  delay,
  sortByVotes,
  isLoggedIn,
  hasRemainingVotes,
  voting,
  onVote,
}: {
  matchup: Matchup;
  delay: number;
  sortByVotes: boolean;
  isLoggedIn: boolean;
  hasRemainingVotes: boolean;
  voting: boolean;
  onVote: (matchup: Matchup, char: CharSide) => void;
}) {
  const chars = useMemo(() => {
    const list = [...m.characters];
    if (sortByVotes) list.sort((a, b) => b.votes - a.votes || a.id - b.id);
    return list;
  }, [m.characters, sortByVotes]);

  return (
    <article
      className="anim-fade-up glass-panel overflow-hidden rounded-2xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <MatchHeader m={m} />

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 md:p-5">
        {chars.map((char) => {
          const voted = !!char.userVoted;
          const canClick =
            m.phase === "live" &&
            !voted &&
            m.userRemainingInGroup > 0 &&
            (!isLoggedIn || hasRemainingVotes) &&
            !voting;
          const tip = !m.canVote
            ? m.phase === "upcoming"
              ? "尚未开始"
              : "已结束"
            : voted
              ? "已投票"
              : m.userRemainingInGroup <= 0
                ? `本组已达上限（${m.voteLimit}）`
                : !isLoggedIn
                  ? "登录后可投票"
                  : !hasRemainingVotes
                    ? "剩余票数不足"
                    : `为「${char.name}」投 1 票`;

          return (
            <div
              key={char.id}
              className="group-char-card relative flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-black/20"
            >
              <Link
                href={`/characters/${char.slug}`}
                data-tip="查看详情"
                className="relative aspect-square w-full overflow-hidden"
              >
                <CharacterPortrait
                  name={char.name}
                  emoji={char.emoji}
                  color={char.color}
                  imageUrl={char.imageUrl}
                  className="absolute inset-0"
                />
                {m.phase === "ended" && m.winners.some((w) => w.id === char.id) && (
                  <span className="absolute left-2 top-2 z-[1] rounded-full bg-[#ffd54f] px-2 py-0.5 text-[10px] font-bold text-[#3a2a00]">
                    胜者
                  </span>
                )}
              </Link>
              <div className="flex flex-1 flex-col px-2.5 pb-3 pt-2 text-center">
                <p className="truncate text-sm font-bold text-white">{char.name}</p>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--text-muted)]">
                  《{char.anime}》
                </p>
                <p className="mt-2 font-display text-lg text-[#ff6b8a]">
                  {char.votes.toLocaleString()}
                  <span className="ml-0.5 text-xs font-sans font-normal text-[var(--text-muted)]">
                    票
                  </span>
                </p>
                {m.phase === "live" ? (
                  <div className="relative mt-2">
                    {voted && (
                      <span className="absolute -top-2 right-0 z-[1] rounded bg-[#ffd54f] px-1.5 py-0.5 text-[9px] font-bold text-[#3a2a00]">
                        已投+1
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={!canClick && !voted}
                      data-tip={tip}
                      onClick={() => onVote(m, char)}
                      className={`w-full rounded-lg py-2 text-sm font-semibold transition ${
                        voted
                          ? "cursor-default bg-white/10 text-[var(--text-muted)]"
                          : "bg-gradient-to-r from-[#fb7299] to-[#e85d84] text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                      }`}
                    >
                      {voted ? "已投票" : "投票"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    {m.phase === "upcoming" ? "未开始" : `${char.percent}%`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function Side({
  char,
  winner,
  accent,
  crowned,
}: {
  char: CharSide;
  winner: boolean;
  accent: "pink" | "blue";
  crowned?: boolean;
}) {
  const ring = winner ? "ring-2 ring-[#ffd54f] ring-offset-2 ring-offset-[#201018]" : "";

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Link
        href={`/characters/${char.slug}`}
        data-tip="点击查看详情"
        className={`relative block w-full max-w-[150px] overflow-hidden rounded-xl transition hover:scale-[1.02] ${ring}`}
      >
        {crowned && (
          <span className="absolute left-1/2 top-1.5 z-[2] -translate-x-1/2 rounded-full bg-[#ffd54f] px-2 py-0.5 text-[10px] font-bold text-[#3a2a00]">
            胜者
          </span>
        )}
        <div className="relative aspect-[3/4] w-full">
          <CharacterPortrait
            name={char.name}
            emoji={char.emoji}
            color={char.color}
            imageUrl={char.imageUrl}
            className="absolute inset-0"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-8 text-left">
            <span className="block truncate text-sm font-bold text-white">{char.name}</span>
            <span className="block truncate text-[10px] text-white/70">《{char.anime}》</span>
          </span>
        </div>
      </Link>
      <div
        className={`text-sm font-bold ${accent === "pink" ? "text-[#ff9eb5]" : "text-[#5ecfff]"}`}
      >
        {char.votes} 票 · {char.percent}%
      </div>
    </div>
  );
}
