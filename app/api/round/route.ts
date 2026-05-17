import { fetchGameRound } from "@/lib/reddit";
import { parseMaxUpvotes, parseMinUpvotes } from "@/lib/reddit/parseMaxUpvotes";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const subreddit = searchParams.get("subreddit");

  if (!subreddit?.trim()) {
    return NextResponse.json(
      { error: "Query parameter `subreddit` is required (e.g. gaming or r/gaming)" },
      { status: 400 },
    );
  }

  const roundParam = searchParams.get("round");
  const round = roundParam ? Number.parseInt(roundParam, 10) : 1;
  const sort = searchParams.get("sort") as
    | "hot"
    | "new"
    | "top"
    | "rising"
    | null;

  const maxUpvotes = parseMaxUpvotes(searchParams.get("maxUpvotes"));
  const minUpvotes = parseMinUpvotes(searchParams.get("minUpvotes"));

  try {
    const payload = await fetchGameRound(subreddit, {
      round: Number.isFinite(round) ? round : 1,
      sort: sort ?? "hot",
      maxUpvotes,
      minUpvotes,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build game round";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
