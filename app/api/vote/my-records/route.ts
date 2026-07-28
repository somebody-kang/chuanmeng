import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserRecords } from "@/lib/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ detail: "请先登录" }, { status: 401 });
  }
  const records = await getUserRecords(user.id);
  return NextResponse.json({ records });
}
