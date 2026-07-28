import { NextRequest, NextResponse } from "next/server";
import { getMatchups, getActiveGroups } from "@/lib/services";
import { getCurrentUser } from "@/lib/auth";
import type { MatchPhase } from "@/lib/match-phase";

export async function GET(request: NextRequest) {
  const group = request.nextUrl.searchParams.get("group") ?? "all";
  const phaseParam = request.nextUrl.searchParams.get("phase") ?? "live";
  const phase = (["live", "upcoming", "ended", "all"].includes(phaseParam)
    ? phaseParam
    : "live") as MatchPhase | "all";

  const user = await getCurrentUser();
  const groups = await getActiveGroups();
  const all = await getMatchups({ group, phase: "all", userId: user?.id ?? null });

  const counts = {
    live: all.filter((m) => m.phase === "live").length,
    upcoming: all.filter((m) => m.phase === "upcoming").length,
    ended: all.filter((m) => m.phase === "ended").length,
  };

  const matchups = phase === "all" ? all : all.filter((m) => m.phase === phase);

  return NextResponse.json({
    groups,
    matchups,
    activeCount: matchups.length,
    phase,
    counts,
  });
}
