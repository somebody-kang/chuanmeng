import { NextRequest, NextResponse } from "next/server";
import { getCharacterMatchStats } from "@/lib/services";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const stats = await getCharacterMatchStats(slug);
  if (!stats) {
    return NextResponse.json({ detail: "角色不存在" }, { status: 404 });
  }
  return NextResponse.json({ stats });
}
