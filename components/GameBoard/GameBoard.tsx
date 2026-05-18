"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./GameBoard.module.css";
import { RoundData, GameBoardProps } from "@/types/types";
import PostCard from "../PostCard/PostCard";
import RoundIndicator, { RoundStatus } from "../RoundIndicator/RoundIndicator";
import { fetchRoundBatch, BATCH_SIZE } from "@/lib/reddit/roundFetcher";

const TOTAL_ROUNDS = 10;

function buildLimitsQuery(upvoteLimits: { minUpvotes: number; maxUpvotes: number } | undefined): string {
  if (!upvoteLimits) return "minUpvotes=1000&maxUpvotes=1000000";
  return `minUpvotes=${upvoteLimits.minUpvotes}&maxUpvotes=${upvoteLimits.maxUpvotes}`;
}

function getUsedPostIds(rounds: RoundData[]): Set<string> {
  const ids = new Set<string>();
  for (const r of rounds) {
    ids.add(r.postA.id);
    ids.add(r.postB.id);
  }
  return ids;
}

export default function GameBoard({
  rounds: initialRounds = [],
  subreddits = [],
  seed = null,
  isEndless = false,
  upvoteLimits,
  onPlayAgain,
}: GameBoardProps) {
  const hasInitialRounds = initialRounds.length > 0;

  const [rounds, setRounds] = useState<RoundData[]>(initialRounds);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundStatuses, setRoundStatuses] = useState<RoundStatus[]>(
    new Array(initialRounds.length).fill("unplayed")
  );
  const [hasGuessed, setHasGuessed] = useState(false);
  const [isEndlessGameOver, setIsEndlessGameOver] = useState(false);

  // Loading states — skip initial load if rounds were passed in from props
  const [isInitialLoading, setIsInitialLoading] = useState(!hasInitialRounds);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prefetchedRound, setPrefetchedRound] = useState<RoundData | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const isPrefetchingRef = useRef(false);

  const limitsQuery = buildLimitsQuery(upvoteLimits);

  useEffect(() => {
    if (hasInitialRounds) return; // skip — page.tsx already fetched them
    if (!subreddits.length) {
      setLoadError("No subreddits configured.");
      setIsInitialLoading(false);
      return;
    }

    let cancelled = false;

    async function loadInitialRounds() {
      setIsInitialLoading(true);
      setLoadError(null);
      try {
        const initial = await fetchRoundBatch({
          subreddits,
          count: BATCH_SIZE,
          startRound: 1,
          limitsQuery,
          seed: seed ?? Math.floor(Math.random() * 1_000_000),
        });
        if (cancelled) return;
        setRounds(initial);
        setRoundStatuses(new Array(initial.length).fill("unplayed"));
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load rounds.");
      } finally {
        if (!cancelled) setIsInitialLoading(false);
      }
    }

    loadInitialRounds();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // run once on mount only

  const prefetchNext = useCallback(
    async (allRounds: RoundData[]) => {
      if (isPrefetchingRef.current) return;

      const nextRoundNumber = allRounds.length + 1;

      // Non-endless: stop prefetching once we have enough rounds
      if (!isEndless && nextRoundNumber > TOTAL_ROUNDS) return;

      isPrefetchingRef.current = true;
      setIsPrefetching(true);
      try {
        const usedIds = getUsedPostIds(allRounds);
        const [next] = await fetchRoundBatch({
          subreddits,
          count: 1,
          startRound: nextRoundNumber,
          limitsQuery,
          seed,
          usedPostIds: usedIds,
        });
        setPrefetchedRound(next ?? null);
      } catch {
        // Silently fail — handleNextRound will retry if needed
        setPrefetchedRound(null);
      } finally {
        isPrefetchingRef.current = false;
        setIsPrefetching(false);
      }
    },
    [subreddits, limitsQuery, seed, isEndless]
  );

  const handleGuess = (selected: "A" | "B") => {
    if (hasGuessed || rounds.length === 0) return;

    const currentRound = rounds[currentRoundIndex];
    const selectedPost = selected === "A" ? currentRound.postA : currentRound.postB;
    const otherPost = selected === "A" ? currentRound.postB : currentRound.postA;
    const isCorrect = selectedPost.upvotes >= otherPost.upvotes;

    setRoundStatuses((prev) => {
      const next = [...prev];
      next[currentRoundIndex] = isCorrect ? "correct" : "wrong";
      return next;
    });
    setHasGuessed(true);

    // Start prefetching next round immediately after guessing
    const shouldPrefetch = isEndless ? isCorrect : true;
    if (shouldPrefetch && !prefetchedRound) {
      prefetchNext(rounds);
    }
  };

  const handleNextRound = async () => {
    const currentStatus = roundStatuses[currentRoundIndex];

    if (isEndless && currentStatus === "wrong") {
      setIsEndlessGameOver(true);
      return;
    }

    // Non-endless: check if game is finished
    const isLastRound = !isEndless && currentRoundIndex + 1 >= TOTAL_ROUNDS;
    if (isLastRound) {
      // Trigger game-over by advancing past the last round
      setHasGuessed(false);
      setCurrentRoundIndex((prev) => prev + 1);
      return;
    }

    // Move to next pre-loaded round if available
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex < rounds.length) {
      setHasGuessed(false);
      setCurrentRoundIndex(nextIndex);

      // Trigger prefetch for the round after this one, if not already fetching
      if (!prefetchedRound && !isPrefetchingRef.current) {
        prefetchNext(rounds);
      }
      return;
    }

    // Need to consume prefetched round
    let nextRound = prefetchedRound;

    if (!nextRound) {
      // Prefetch wasn't ready — re-trigger and wait
      if (!isPrefetchingRef.current) {
        await prefetchNext(rounds);
      }
      // Can't advance yet — the UI shows "Loading..." on the center button
      return;
    }

    const updatedRounds = [...rounds, nextRound];
    setRounds(updatedRounds);
    setRoundStatuses((prev) => [...prev, "unplayed"]);
    setPrefetchedRound(null);
    setHasGuessed(false);
    setCurrentRoundIndex(nextIndex);

    // Immediately start fetching the round after this one
    prefetchNext(updatedRounds);
  };

  if (isInitialLoading) {
    return (
      <div className={styles.gameOverContainer}>
        <div className="w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xl text-gray-300">Loading rounds...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.gameOverContainer}>
        <h2 className={styles.gameOverTitle}>Failed to Load</h2>
        <p className={styles.gameOverScore}>{loadError}</p>
        <button onClick={onPlayAgain} className={styles.gameOverButton}>
          Try Again
        </button>
      </div>
    );
  }

  const isGameOver = isEndless
    ? isEndlessGameOver
    : currentRoundIndex >= TOTAL_ROUNDS;

  if (isGameOver) {
    if (isEndless) {
      return (
        <div className={styles.gameOverContainer}>
          <h2 className={styles.gameOverTitle}>Endless Game Over!</h2>
          <p className={styles.gameOverScore}>
            You completed {currentRoundIndex} rounds before failing!
          </p>
          {seed !== null && seed !== undefined && (
            <p className={styles.gameOverSeed}>
              Seed: <strong className={styles.highlightSeed}>{seed}</strong>
            </p>
          )}
          <button onClick={onPlayAgain} className={styles.gameOverButton}>
            Play Again
          </button>
        </div>
      );
    }

    const correctCount = roundStatuses.filter((s) => s === "correct").length;
    return (
      <div className={styles.gameOverContainer}>
        <h2 className={styles.gameOverTitle}>Game Over!</h2>
        <p className={styles.gameOverScore}>
          You got {correctCount} out of {TOTAL_ROUNDS} correct.
        </p>
        {seed !== null && seed !== undefined && (
          <p className={styles.gameOverSeed}>
            Seed: <strong className={styles.highlightSeed}>{seed}</strong>
          </p>
        )}
        <button onClick={onPlayAgain} className={styles.gameOverButton}>
          Play Again
        </button>
      </div>
    );
  }

  if (rounds.length === 0 || currentRoundIndex >= rounds.length) {
    return (
      <div className={styles.gameOverContainer}>
        <div className="w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xl text-gray-300">Loading next round...</p>
      </div>
    );
  }

  const currentRound = rounds[currentRoundIndex];
  const postA = currentRound.postA;
  const postB = currentRound.postB;

  const getPostStatus = (post: "A" | "B") => {
    if (!hasGuessed) return "none";
    const thisPost = post === "A" ? postA : postB;
    const otherPost = post === "A" ? postB : postA;
    return thisPost.upvotes >= otherPost.upvotes ? "winner" : "loser";
  };

  // Busy = endless mode where user clicked Next but prefetch isn't ready yet
  const nextButtonBusy = hasGuessed && isPrefetching && !prefetchedRound && isEndless;
  const nextLabel = nextButtonBusy
    ? "Loading..."
    : isEndless && roundStatuses[currentRoundIndex] === "wrong"
      ? "Score"
      : "Next";

  return (
    <div className={`fixed inset-0 flex flex-col md:flex-row overflow-hidden ${styles.boardRoot}`}>
      {/* Header */}
      <div className={`pointer-events-none z-50 ${styles.roundIndicatorContainer}`}>
        <div className="pointer-events-auto flex flex-col items-center">
          <div className={styles.desktopHeaderInfo}>
            <span className={styles.desktopRoundText}>Round {currentRound.round}</span>
            <span className={styles.desktopSeparator}>•</span>
            <span className={styles.desktopSubredditText}>{currentRound.subreddit}</span>
          </div>
          {!isEndless && (
            <RoundIndicator
              rounds={[
                ...roundStatuses.slice(0, TOTAL_ROUNDS),
                ...new Array(Math.max(0, TOTAL_ROUNDS - roundStatuses.length)).fill("unplayed"),
              ]}
            />
          )}
        </div>
      </div>

      {/* Center Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
        <div className={styles.centerOverlayLayout}>
          <div className={styles.centerOverlaySideText}>
            <span className={styles.roundText}>Round {currentRound.round}</span>
          </div>

          {hasGuessed ? (
            <div
              className={`pointer-events-auto ${styles.centerCircle} ${roundStatuses[currentRoundIndex] === "correct"
                ? styles.circleCorrect
                : styles.circleWrong
                } ${nextButtonBusy ? styles.circleLoading : ""}`}
              onClick={!nextButtonBusy ? handleNextRound : undefined}
              role="button"
              tabIndex={0}
              aria-disabled={nextButtonBusy}
              onKeyDown={(e) => {
                if (!nextButtonBusy && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleNextRound();
                }
              }}
            >
              <span className={styles.vsText}>{nextLabel}</span>
            </div>
          ) : (
            <div className={`pointer-events-auto ${styles.centerCircle}`}>
              <span className={styles.vsText}>VS</span>
            </div>
          )}

          <div className={styles.centerOverlaySideText}>
            <span className={styles.subredditText}>{currentRound.subreddit}</span>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div key={`left-${currentRoundIndex}`} className={`flex-1 min-h-0 w-full relative ${styles.leftCard} ${styles.fadeIn}`}>
        <PostCard post={postA} onClick={() => handleGuess("A")} showUpvotes={hasGuessed} status={getPostStatus("A")} />
      </div>
      <div key={`right-${currentRoundIndex}`} className={`flex-1 min-h-0 w-full relative ${styles.fadeIn}`}>
        <PostCard post={postB} onClick={() => handleGuess("B")} showUpvotes={hasGuessed} status={getPostStatus("B")} />
      </div>
    </div>
  );
}