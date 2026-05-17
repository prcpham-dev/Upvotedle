import { fetchDailyPuzzle } from "@/lib/reddit/fetchDaily";
import { parseMaxUpvotes } from "@/lib/reddit/parseMaxUpvotes";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const maxUpvotes = parseMaxUpvotes(
    request.nextUrl.searchParams.get("maxUpvotes"),
  );

  try {
    const payload = await fetchDailyPuzzle({ maxUpvotes });
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load daily puzzle";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
