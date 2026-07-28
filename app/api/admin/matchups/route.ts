import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import {
  createMatchup,
  listAdminMatchups,
  updateMatchupSchedule,
  updateMatchupStatus,
} from "@/lib/admin-services";
import { parseDatetimeLocal, resolveMatchPhase } from "@/lib/match-phase";
import { MODE_LABEL } from "@/lib/services";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ detail: "未授权" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const matchups = await listAdminMatchups();
  const now = new Date();
  return NextResponse.json({
    matchups: matchups.map((m) => {
      const characters = m.participants.map((p) => ({
        id: p.character.id,
        name: p.character.name,
        emoji: p.character.emoji,
        votes: m.voteStats.find((s) => s.characterId === p.characterId)?.voteCount ?? 0,
      }));
      return {
        id: m.id,
        groupLabel: m.groupLabel,
        mode: m.mode,
        modeLabel: MODE_LABEL[m.mode as "duel" | "group"] ?? m.mode,
        voteLimit: m.voteLimit,
        status: m.status,
        phase: resolveMatchPhase(m, now),
        roundName: m.round.name,
        startAt: m.startAt?.toISOString() ?? null,
        endAt: m.endAt?.toISOString() ?? null,
        characters,
        characterA: characters[0] ?? null,
        characterB: characters[1] ?? null,
        votesA: characters[0]?.votes ?? 0,
        votesB: characters[1]?.votes ?? 0,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const body = await request.json();
    const mode = body.mode === "group" ? "group" : "duel";
    let characterIds: number[] = Array.isArray(body.characterIds)
      ? body.characterIds.map(Number)
      : [];

    // 兼容旧字段
    if (!characterIds.length && body.characterAId && body.characterBId) {
      characterIds = [Number(body.characterAId), Number(body.characterBId)];
    }

    const startAt = body.startAt ? parseDatetimeLocal(String(body.startAt)) : new Date();
    const endAt = body.endAt ? parseDatetimeLocal(String(body.endAt)) : null;
    const matchup = await createMatchup({
      mode,
      characterIds,
      groupLabel: String(body.groupLabel ?? ""),
      voteLimit: body.voteLimit !== undefined ? Number(body.voteLimit) : undefined,
      roundName: body.roundName ? String(body.roundName) : undefined,
      startAt,
      endAt,
    });
    return NextResponse.json({ success: true, matchup });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "创建失败" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ detail: "缺少 id" }, { status: 400 });

    if (body.action === "schedule") {
      const matchup = await updateMatchupSchedule(id, {
        startAt: body.startAt !== undefined ? parseDatetimeLocal(body.startAt) : undefined,
        endAt: body.endAt !== undefined ? parseDatetimeLocal(body.endAt) : undefined,
        status: body.status === "ended" || body.status === "active" ? body.status : undefined,
      });
      return NextResponse.json({ success: true, matchup });
    }

    const status = body.status === "ended" ? "ended" : "active";
    const matchup = await updateMatchupStatus(id, status);
    return NextResponse.json({ success: true, matchup });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "更新失败" },
      { status: 400 }
    );
  }
}
