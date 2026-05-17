import { fetchDailyPuzzle } from "@/lib/reddit/fetchDaily";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const payload = await fetchDailyPuzzle();
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load daily puzzle";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
