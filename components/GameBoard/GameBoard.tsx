"use client";

import React, { useState } from "react";
import styles from "./GameBoard.module.css";
import { RoundData, GameBoardProps } from "../../types/types";
import PostCard from "../PostCard/PostCard";
import RoundIndicator, { RoundStatus } from "../RoundIndicator/RoundIndicator";

export default function GameBoard({
  rounds: initialRounds,
  onPlayAgain,
  isEndless = false,
  subreddits = [],
  upvoteLimits,
  seed = null,
}: GameBoardProps) {
  const [dynamicRounds, setDynamicRounds] = useState<RoundData[]>(initialRounds);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundStatuses, setRoundStatuses] = useState<RoundStatus[]>(
    new Array(initialRounds.length).fill("unplayed")
  );
  const [isEndlessGameOver, setIsEndlessGameOver] = useState(false);
  const [nextRoundData, setNextRoundData] = useState<RoundData | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);

  if (dynamicRounds.length === 0) {
    return <div>No rounds available.</div>;
  }

  const isGameOver = isEndless
    ? isEndlessGameOver
    : currentRoundIndex >= dynamicRounds.length;

  if (isGameOver) {
    if (isEndless) {
      return (
        <div className={styles.gameOverContainer}>
          <h2 className={styles.gameOverTitle}>Endless Game Over!</h2>
          <p className={styles.gameOverScore}>
            You successfully completed {currentRoundIndex} rounds before failing!
          </p>
          {seed !== null && (
            <p className={styles.gameOverSeed}>
              Seed of this run: <strong className={styles.highlightSeed}>{seed}</strong>
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
          You got {correctCount} out of {dynamicRounds.length} correct.
        </p>
        {seed !== null && (
          <p className={styles.gameOverSeed}>
            Seed of this run: <strong className={styles.highlightSeed}>{seed}</strong>
          </p>
        )}
        <button onClick={onPlayAgain} className={styles.gameOverButton}>
          Play Again
        </button>
      </div>
    );
  }

  const currentRound = dynamicRounds[currentRoundIndex];
  const postA = currentRound.postA;
  const postB = currentRound.postB;

  const fetchNextRound = async (nextIndex: number) => {
    if (isFetchingNext) return;
    setIsFetchingNext(true);

    try {
      const minUp = upvoteLimits?.minUpvotes ?? 1000;
      const maxUp = upvoteLimits?.maxUpvotes ?? 1000000;
      const limitsQuery = `minUpvotes=${minUp}&maxUpvotes=${maxUp}`;
      
      let data: any = null;
      let attempts = 0;

      while (!data && attempts < Math.max(10, subreddits.length)) {
        const subIndex = (nextIndex - 1 + attempts) % subreddits.length;
        const selectedSub = subreddits.length > 0 ? subreddits[subIndex] : "memes";
        const seedParam = seed !== null ? `&seed=${seed + nextIndex - 1 + attempts}` : "";

        try {
          const res = await fetch(
            `/api/round?subreddit=${encodeURIComponent(selectedSub)}&round=${nextIndex}&${limitsQuery}${seedParam}`
          );
          if (res.ok) {
            const json = await res.json();
            if (json && json[0] && !json.error) {
              data = json[0];
              break;
            }
          }
        } catch (e) {
          // Silent catch to fallback to next candidate
        }
        attempts++;
      }

      if (data) {
        setNextRoundData(data);
      }
    } catch (err) {
      console.error("Error prefetching next round:", err);
    } finally {
      setIsFetchingNext(false);
    }
  };

  const handleGuess = (selected: "A" | "B") => {
    if (hasGuessed) return;

    const selectedPost = selected === "A" ? postA : postB;
    const otherPost = selected === "A" ? postB : postA;

    const isCorrect = selectedPost.upvotes >= otherPost.upvotes;

    const newStatuses = [...roundStatuses];
    newStatuses[currentRoundIndex] = isCorrect ? "correct" : "wrong";
    setRoundStatuses(newStatuses);
    setHasGuessed(true);

    // Background prefetch next round immediately if they guessed right in endless mode!
    if (isEndless && isCorrect) {
      fetchNextRound(dynamicRounds.length + 1);
    }
  };

  const handleNextRound = async () => {
    if (isEndless) {
      if (roundStatuses[currentRoundIndex] === "wrong") {
        setIsEndlessGameOver(true);
        return;
      }

      let nextRound = nextRoundData;
      if (!nextRound) {
        // Fallback: Synchronous fetch if background prefetch wasn't ready
        try {
          const minUp = upvoteLimits?.minUpvotes ?? 1000;
          const maxUp = upvoteLimits?.maxUpvotes ?? 1000000;
          const limitsQuery = `minUpvotes=${minUp}&maxUpvotes=${maxUp}`;
          
          let attempts = 0;
          while (!nextRound && attempts < Math.max(10, subreddits.length)) {
            const subIndex = (dynamicRounds.length + attempts) % subreddits.length;
            const selectedSub = subreddits.length > 0 ? subreddits[subIndex] : "memes";
            const nextIndex = dynamicRounds.length + 1;
            const seedParam = seed !== null ? `&seed=${seed + nextIndex - 1 + attempts}` : "";

            try {
              const res = await fetch(
                `/api/round?subreddit=${encodeURIComponent(selectedSub)}&round=${nextIndex}&${limitsQuery}${seedParam}`
              );
              if (res.ok) {
                const json = await res.json();
                if (json && json[0] && !json.error) {
                  nextRound = json[0];
                  break;
                }
              }
            } catch (e) {
              // Silent catch
            }
            attempts++;
          }
        } catch (err) {
          console.error("Failed to fallback-fetch next round:", err);
          return;
        }
      }

      if (nextRound) {
        setDynamicRounds((prev) => [...prev, nextRound]);
        setRoundStatuses((prev) => [...prev, "unplayed"]);
        setNextRoundData(null);
        setHasGuessed(false);
        setCurrentRoundIndex((prev) => prev + 1);
      }
    } else {
      setHasGuessed(false);
      setCurrentRoundIndex(currentRoundIndex + 1);
    }
  };

  const getPostStatus = (post: "A" | "B") => {
    if (!hasGuessed) return "none";
    const thisPost = post === "A" ? postA : postB;
    const otherPost = post === "A" ? postB : postA;

    if (thisPost.upvotes > otherPost.upvotes) return "winner";
    if (thisPost.upvotes < otherPost.upvotes) return "loser";
    return "winner";
  };

  return (
    <div className={`fixed inset-0 flex flex-col md:flex-row overflow-hidden ${styles.boardRoot}`}>
      {/* Top Header/Indicator Container */}
      <div className={`pointer-events-none z-50 ${styles.roundIndicatorContainer}`}>
        <div className="pointer-events-auto flex flex-col items-center">
          <div className={styles.desktopHeaderInfo}>
            <span className={styles.desktopRoundText}>Round {currentRound.round}</span>
            <span className={styles.desktopSeparator}>•</span>
            <span className={styles.desktopSubredditText}>{currentRound.subreddit}</span>
          </div>
          {!isEndless && <RoundIndicator rounds={roundStatuses} />}
        </div>
      </div>

      {/* Center Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40`}>
        <div className={styles.centerOverlayLayout}>
          <div className={styles.centerOverlaySideText}>
            <span className={styles.roundText}>Round {currentRound.round}</span>
          </div>

          {hasGuessed ? (
            <div
              className={`pointer-events-auto ${styles.centerCircle} ${roundStatuses[currentRoundIndex] === "correct"
                ? styles.circleCorrect
                : styles.circleWrong
                }`}
              onClick={handleNextRound}
              role="button"
              tabIndex={0}
            >
              <span className={styles.vsText}>
                {isEndless && roundStatuses[currentRoundIndex] === "wrong" ? "Score" : "Next"}
              </span>
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

      {/* Left Card */}
      <div key={`left-${currentRoundIndex}`} className={`flex-1 w-full h-full relative ${styles.leftCard} ${styles.fadeIn}`}>
        <PostCard
          post={postA}
          onClick={() => handleGuess("A")}
          showUpvotes={hasGuessed}
          status={getPostStatus("A")}
        />
      </div>

      {/* Right Card */}
      <div key={`right-${currentRoundIndex}`} className={`flex-1 w-full h-full relative ${styles.fadeIn}`}>
        <PostCard
          post={postB}
          onClick={() => handleGuess("B")}
          showUpvotes={hasGuessed}
          status={getPostStatus("B")}
        />
      </div>
    </div>
  );
}