import { fetchDailyPuzzle } from "@/lib/reddit/fetchDaily";
import { parseMaxUpvotes, parseMinUpvotes } from "@/lib/reddit/parseMaxUpvotes";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const maxUpvotes = parseMaxUpvotes(searchParams.get("maxUpvotes"));
  const minUpvotes = parseMinUpvotes(searchParams.get("minUpvotes"));

  try {
    const payload = await fetchDailyPuzzle({ maxUpvotes, minUpvotes });
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load daily puzzle";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
