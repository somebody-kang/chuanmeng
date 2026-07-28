import { NextResponse } from "next/server";
import { getMatchupReport } from "@/lib/services";

export async function GET() {
  const report = await getMatchupReport();
  return NextResponse.json(report);
}
