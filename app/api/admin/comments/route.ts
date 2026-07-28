import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin";
import { deleteComment, listAdminComments } from "@/lib/admin-services";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ detail: "未授权" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const comments = await listAdminComments();
  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
      character: c.character,
    })),
  });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  try {
    const id = Number(request.nextUrl.searchParams.get("id") || (await request.json().catch(() => ({}))).id);
    if (!id) return NextResponse.json({ detail: "缺少 id" }, { status: 400 });
    await deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : "删除失败" },
      { status: 400 }
    );
  }
}
