"use client";

import React, { useState } from "react";
import styles from "./GameBoard.module.css";
import { RoundData } from "../../types/types";
import PostCard from "../PostCard/PostCard";
import RoundIndicator, { RoundStatus } from "../RoundIndicator/RoundIndicator";

interface GameBoardProps {
  rounds: RoundData[];
  onPlayAgain: () => void;
}

export default function GameBoard({ rounds, onPlayAgain }: GameBoardProps) {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundStatuses, setRoundStatuses] = useState<RoundStatus[]>(
    new Array(rounds.length).fill("unplayed")
  );

  if (rounds.length === 0) {
    return <div>No rounds available.</div>;
  }

  const isGameOver = currentRoundIndex >= rounds.length;

  if (isGameOver) {
    const correctCount = roundStatuses.filter((s) => s === "correct").length;
    return (
      <div className={styles.gameOverContainer}>
        <h2 className={styles.gameOverTitle}>Game Over!</h2>
        <p className={styles.gameOverScore}>
          You got {correctCount} out of {rounds.length} correct.
        </p>
        <button onClick={onPlayAgain} className={styles.gameOverButton}>
          Play Again
        </button>
      </div>
    );
  }

  const currentRound = rounds[currentRoundIndex];
  const postA = currentRound.postA;
  const postB = currentRound.postB;

  const handleGuess = (selected: "A" | "B") => {
    if (hasGuessed) return;

    const selectedPost = selected === "A" ? postA : postB;
    const otherPost = selected === "A" ? postB : postA;

    const isCorrect = selectedPost.upvotes >= otherPost.upvotes;

    const newStatuses = [...roundStatuses];
    newStatuses[currentRoundIndex] = isCorrect ? "correct" : "wrong";
    setRoundStatuses(newStatuses);
    setHasGuessed(true);
  };

  const handleNextRound = () => {
    setHasGuessed(false);
    setCurrentRoundIndex(currentRoundIndex + 1);
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
      {/* Top Round Indicator */}
      <div className="absolute top-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <RoundIndicator rounds={roundStatuses} />
        </div>
      </div>

      {/* Center Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40">
        <div className={`pointer-events-auto ${styles.centerCircle}`}>
          <h2 className={styles.roundText}>Round {currentRound.round}</h2>
          <p className={styles.subredditText}>{currentRound.subreddit}</p>

          <div className={styles.vsText}>VS</div>

          {hasGuessed && (
            <div className={styles.resultContainer}>
              {roundStatuses[currentRoundIndex] === "correct" ? (
                <span className={styles.resultCorrect}>Correct!</span>
              ) : (
                <span className={styles.resultWrong}>Wrong!</span>
              )}
              <button onClick={handleNextRound} className={styles.nextRoundButton}>
                Next Round
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Left Card */}
      <div className={`flex-1 w-full h-full relative ${styles.leftCard}`}>
        <PostCard
          post={postA}
          onClick={() => handleGuess("A")}
          showUpvotes={hasGuessed}
          status={getPostStatus("A")}
        />
      </div>

      {/* Right Card */}
      <div className="flex-1 w-full h-full relative">
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