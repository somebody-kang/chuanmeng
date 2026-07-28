import { prisma } from "@/lib/prisma";
import { VOTE_TOTAL_LIMIT } from "@/lib/constants";
import { assertCleanComment } from "@/lib/word-filter";
import { parseGallery, type GalleryItem } from "@/lib/gallery";
import {
  assertMatchupOpenForVote,
  resolveMatchPhase,
  type MatchPhase,
} from "@/lib/match-phase";

export type { GalleryItem, MatchPhase };

export type MatchMode = "duel" | "group";

export const GROUP_LABELS: Record<string, string> = {
  anime: "动画",
  game: "游戏",
  comic: "漫画",
  vtuber: "虚拟歌手",
};

export const MODE_LABEL: Record<MatchMode, string> = {
  duel: "决斗赛",
  group: "小组赛",
};

function charPayload(c: {
  id: number;
  slug: string;
  name: string;
  anime: string;
  groupName: string;
  description: string;
  emoji: string;
  imageUrl: string | null;
  galleryJson: string;
  color: string;
}) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    anime: c.anime,
    group: c.groupName,
    description: c.description,
    emoji: c.emoji,
    imageUrl: c.imageUrl,
    gallery: parseGallery(c.galleryJson),
    color: c.color,
  };
}

export async function getCharacters() {
  const characters = await prisma.character.findMany({
    include: { voteStats: true },
    orderBy: { id: "asc" },
  });

  return characters
    .map((c) => ({
      ...charPayload(c),
      totalVotes: c.voteStats.reduce((sum, s) => sum + s.voteCount, 0),
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes || a.id - b.id);
}

export async function getCharacterBySlug(slug: string) {
  const c = await prisma.character.findUnique({
    where: { slug },
    include: { voteStats: true },
  });
  if (!c) return null;
  return {
    ...charPayload(c),
    totalVotes: c.voteStats.reduce((sum, s) => sum + s.voteCount, 0),
  };
}

/** 角色各对阵得票 */
export async function getCharacterMatchStats(slug: string) {
  const c = await prisma.character.findUnique({ where: { slug } });
  if (!c) return null;

  const stats = await prisma.voteStat.findMany({
    where: { characterId: c.id },
    include: {
      matchup: {
        include: {
          round: true,
          participants: { include: { character: true }, orderBy: { sortOrder: "asc" } },
          voteStats: true,
        },
      },
    },
  });

  return stats.map((s) => {
    const m = s.matchup;
    const total = m.voteStats.reduce((sum, v) => sum + v.voteCount, 0);
    const others = m.participants
      .filter((p) => p.characterId !== c.id)
      .map((p) => {
        const votes = m.voteStats.find((v) => v.characterId === p.characterId)?.voteCount ?? 0;
        return { name: p.character.name, emoji: p.character.emoji, votes };
      });

    const topOpponent = others.sort((a, b) => b.votes - a.votes)[0];

    return {
      matchupId: m.id,
      roundName: m.round.name,
      groupLabel: m.groupLabel,
      mode: m.mode as MatchMode,
      votes: s.voteCount,
      opponentVotes: topOpponent?.votes ?? 0,
      percent: total ? Math.round((s.voteCount / total) * 100) : 0,
      opponentName:
        m.mode === "duel"
          ? topOpponent?.name ?? "—"
          : others.map((o) => o.name).join(" / ") || "—",
      opponentEmoji: topOpponent?.emoji ?? "🌸",
      status: m.status,
    };
  });
}

export async function getActiveGroups() {
  const rows = await prisma.matchup.findMany({
    select: { groupLabel: true },
    distinct: ["groupLabel"],
    orderBy: { groupLabel: "asc" },
  });
  return rows.map((r) => r.groupLabel);
}

export async function getMatchups(opts?: {
  group?: string | null;
  phase?: MatchPhase | "all" | null;
  userId?: number | null;
}) {
  const group = opts?.group;
  const phaseFilter = opts?.phase ?? "all";
  const userId = opts?.userId ?? null;

  const matchups = await prisma.matchup.findMany({
    where: {
      ...(group && group !== "all" ? { groupLabel: group } : {}),
    },
    include: {
      round: true,
      participants: {
        include: { character: true },
        orderBy: { sortOrder: "asc" },
      },
      voteStats: true,
    },
    orderBy: [{ groupLabel: "asc" }, { id: "asc" }],
  });

  const userVotes =
    userId == null
      ? []
      : await prisma.voteRecord.findMany({
          where: {
            userId,
            matchupId: { in: matchups.map((m) => m.id) },
          },
          select: { matchupId: true, characterId: true },
        });

  const votedByMatchup = new Map<number, Set<number>>();
  for (const r of userVotes) {
    const set = votedByMatchup.get(r.matchupId) ?? new Set<number>();
    set.add(r.characterId);
    votedByMatchup.set(r.matchupId, set);
  }

  const now = new Date();
  const mapped = matchups.map((m) => {
    const phase = resolveMatchPhase(m, now);
    const mode = (m.mode === "group" ? "group" : "duel") as MatchMode;
    const totalVotes = m.voteStats.reduce((sum, s) => sum + s.voteCount, 0);
    const votedSet = votedByMatchup.get(m.id) ?? new Set<number>();
    const userVoteCount = votedSet.size;

    const characters = m.participants.map((p) => {
      const votes = m.voteStats.find((s) => s.characterId === p.characterId)?.voteCount ?? 0;
      return {
        ...charPayload(p.character),
        votes,
        percent: totalVotes ? Math.round((votes / totalVotes) * 100) : mode === "duel" ? 50 : 0,
        userVoted: votedSet.has(p.characterId),
      };
    });

    // 决斗赛兼容字段
    const characterA = characters[0] ?? null;
    const characterB = characters[1] ?? null;

    let winnerId: number | null = null;
    let winners: typeof characters = [];
    if (phase === "ended" && characters.length) {
      const maxVotes = Math.max(...characters.map((c) => c.votes));
      if (maxVotes > 0) {
        winners = characters.filter((c) => c.votes === maxVotes);
        if (mode === "duel" && winners.length === 1) winnerId = winners[0].id;
        else if (mode === "group") winnerId = winners[0]?.id ?? null;
      }
    }

    return {
      id: m.id,
      groupLabel: m.groupLabel,
      mode,
      voteLimit: m.voteLimit,
      status: m.status,
      phase,
      roundName: m.round.name,
      startAt: m.startAt?.toISOString() ?? null,
      endAt: m.endAt?.toISOString() ?? null,
      totalVotes,
      winnerId,
      winners: winners.map((w) => ({ id: w.id, name: w.name, emoji: w.emoji })),
      characters,
      characterA,
      characterB,
      canVote: phase === "live",
      userVoteCount,
      userRemainingInGroup: Math.max(0, m.voteLimit - userVoteCount),
      participantCount: characters.length,
    };
  });

  if (phaseFilter && phaseFilter !== "all") {
    return mapped.filter((m) => m.phase === phaseFilter);
  }
  return mapped;
}

/** 战报：全部对阵，默认已结束优先 */
export async function getMatchupReport() {
  const all = await getMatchups({ phase: "all" });
  const ended = all.filter((m) => m.phase === "ended");
  const live = all.filter((m) => m.phase === "live");
  const upcoming = all.filter((m) => m.phase === "upcoming");

  const winners = new Map<number, { id: number; name: string; emoji: string; wins: number }>();
  for (const m of ended) {
    for (const w of m.winners) {
      const prev = winners.get(w.id);
      if (prev) prev.wins += 1;
      else winners.set(w.id, { id: w.id, name: w.name, emoji: w.emoji, wins: 1 });
    }
  }

  return {
    summary: {
      ended: ended.length,
      live: live.length,
      upcoming: upcoming.length,
      totalVotes: all.reduce((s, m) => s + m.totalVotes, 0),
    },
    leaderboard: [...winners.values()].sort((a, b) => b.wins - a.wins || a.id - b.id),
    matchups: [...ended, ...live, ...upcoming],
  };
}

export async function submitVote(
  userId: number,
  matchupId: number,
  characterId: number,
  votes = 1
) {
  if (votes < 1) throw new Error("投票数至少为 1");

  return prisma.$transaction(async (tx) => {
    const quota = await tx.voteQuota.findUnique({ where: { userId } });
    if (!quota) throw new Error("用户配额不存在");
    if (quota.usedCount + votes > quota.totalLimit) throw new Error("剩余票数不足");

    const matchup = await tx.matchup.findUnique({
      where: { id: matchupId },
      include: { participants: true },
    });
    if (!matchup) throw new Error("对阵不存在");
    assertMatchupOpenForVote(matchup);

    const inGroup = matchup.participants.some((p) => p.characterId === characterId);
    if (!inGroup) throw new Error("只能给本组角色投票");

    const alreadyForChar = await tx.voteRecord.findUnique({
      where: {
        userId_matchupId_characterId: { userId, matchupId, characterId },
      },
    });
    if (alreadyForChar) throw new Error("已为该角色投过票");

    const userVotesInGroup = await tx.voteRecord.count({
      where: { userId, matchupId },
    });
    if (userVotesInGroup >= matchup.voteLimit) {
      throw new Error(
        matchup.mode === "duel"
          ? "该对阵已投过票"
          : `本组最多可选 ${matchup.voteLimit} 名角色`
      );
    }

    // 决斗赛：只能投一方，且只能 1 票
    if (matchup.mode === "duel" && userVotesInGroup > 0) {
      throw new Error("该对阵已投过票");
    }

    await tx.voteRecord.create({
      data: { userId, matchupId, characterId, votes },
    });

    await tx.voteStat.update({
      where: { matchupId_characterId: { matchupId, characterId } },
      data: { voteCount: { increment: votes } },
    });

    const updatedQuota = await tx.voteQuota.update({
      where: { userId },
      data: { usedCount: { increment: votes } },
    });

    const stat = await tx.voteStat.findUnique({
      where: { matchupId_characterId: { matchupId, characterId } },
    });

    return {
      success: true,
      newVotes: stat?.voteCount ?? votes,
      remaining: updatedQuota.totalLimit - updatedQuota.usedCount,
      usedCount: updatedQuota.usedCount,
      totalLimit: updatedQuota.totalLimit,
      groupRemaining: Math.max(0, matchup.voteLimit - (userVotesInGroup + 1)),
      voteLimit: matchup.voteLimit,
    };
  });
}

export async function getUserRecords(userId: number) {
  const records = await prisma.voteRecord.findMany({
    where: { userId },
    include: {
      character: true,
      matchup: {
        include: {
          participants: { include: { character: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return records.map((r) => {
    const others = r.matchup.participants
      .filter((p) => p.characterId !== r.characterId)
      .map((p) => p.character.name);
    return {
      id: r.id,
      votes: r.votes,
      createdAt: r.createdAt.toISOString(),
      matchupId: r.matchupId,
      groupLabel: r.matchup.groupLabel,
      mode: r.matchup.mode,
      characterName: r.character.name,
      characterEmoji: r.character.emoji,
      opponentName:
        r.matchup.mode === "duel" ? others[0] ?? "—" : others.slice(0, 3).join("、") || "—",
    };
  });
}

export async function listComments(characterId: number, limit = 50) {
  const rows = await prisma.comment.findMany({
    where: { characterId },
    include: { user: { select: { id: true, nickname: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    user: {
      id: r.user.id,
      nickname: r.user.nickname,
      avatar: r.user.avatar,
    },
  }));
}

export async function createComment(userId: number, characterId: number, content: string) {
  assertCleanComment(content);
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) throw new Error("角色不存在");

  const comment = await prisma.comment.create({
    data: { userId, characterId, content: content.trim() },
    include: { user: { select: { id: true, nickname: true, avatar: true } } },
  });

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    user: {
      id: comment.user.id,
      nickname: comment.user.nickname,
      avatar: comment.user.avatar,
    },
  };
}

export { VOTE_TOTAL_LIMIT };
