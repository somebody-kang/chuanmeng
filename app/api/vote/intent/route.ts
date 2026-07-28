import { NextRequest, NextResponse } from "next/server";
import { assertWechatBound, getCurrentUser } from "@/lib/auth";
import { submitVote } from "@/lib/services";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ detail: "请先使用微信登录后再投票" }, { status: 401 });
  }

  try {
    assertWechatBound(user);
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "需绑定微信" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const matchupId = Number(body.matchupId);
    const characterId = Number(body.characterId);
    const votes = Number(body.votes ?? 1);

    if (!matchupId || !characterId) {
      return NextResponse.json({ detail: "参数无效" }, { status: 400 });
    }

    const result = await submitVote(user.id, matchupId, characterId, votes);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "投票失败" },
      { status: 400 }
    );
  }
}
