import { NextResponse } from "next/server";
import { getCharacters } from "@/lib/services";

export async function GET() {
  const characters = await getCharacters();
  return NextResponse.json({ characters });
}
