import { NextRequest, NextResponse } from "next/server";
import { assertWechatBound, getCurrentUser } from "@/lib/auth";
import { createComment, listComments } from "@/lib/services";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const characterId = Number(request.nextUrl.searchParams.get("characterId"));
  if (!characterId) {
    return NextResponse.json({ detail: "缺少 characterId" }, { status: 400 });
  }

  const comments = await listComments(characterId);
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  try {
    assertWechatBound(user);
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "请先登录" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const characterId = Number(body.characterId);
    const content = String(body.content ?? "");

    if (!characterId) {
      return NextResponse.json({ detail: "缺少 characterId" }, { status: 400 });
    }

    const exists = await prisma.character.findUnique({ where: { id: characterId } });
    if (!exists) {
      return NextResponse.json({ detail: "角色不存在" }, { status: 404 });
    }

    const comment = await createComment(user.id, characterId, content);
    return NextResponse.json({ success: true, comment });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "评论失败" },
      { status: 400 }
    );
  }
}
