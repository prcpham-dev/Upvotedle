import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GameBoard.module.css';
import type { RoundData, GameBoardProps } from '../../types/types';
import PostCard from '../PostCard/PostCard';
import RoundIndicator, { type RoundStatus } from '../RoundIndicator/RoundIndicator';
import { fetchRoundBatch, BATCH_SIZE } from '../../lib/roundFetcher';

const TOTAL_ROUNDS = 10;

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
  onPlayAgain,
}: GameBoardProps) {
  const hasInitialRounds = initialRounds.length > 0;

  const [rounds, setRounds] = useState<RoundData[]>(initialRounds);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundStatuses, setRoundStatuses] = useState<RoundStatus[]>(
    new Array(initialRounds.length).fill('unplayed')
  );
  const [hasGuessed, setHasGuessed] = useState(false);
  const [isEndlessGameOver, setIsEndlessGameOver] = useState(false);

  // Loading states — skip initial load if rounds were passed in from props
  const [isInitialLoading, setIsInitialLoading] = useState(!hasInitialRounds);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prefetchedRound, setPrefetchedRound] = useState<RoundData | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const isPrefetchingRef = useRef(false);


  useEffect(() => {
    if (hasInitialRounds) return; // skip — game.tsx already fetched them
    if (!subreddits.length) {
      setLoadError('No subreddits configured.');
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
          seed: seed ?? Math.floor(Math.random() * 1_000_000),
        });
        if (cancelled) return;
        setRounds(initial);
        setRoundStatuses(new Array(initial.length).fill('unplayed'));
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load rounds.');
      } finally {
        if (!cancelled) setIsInitialLoading(false);
      }
    }

    void loadInitialRounds();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          seed: seed ?? Math.floor(Math.random() * 1_000_000),
          usedPostIds: usedIds,
        });
        setPrefetchedRound(next ?? null);
      } catch {
        setPrefetchedRound(null);
      } finally {
        isPrefetchingRef.current = false;
        setIsPrefetching(false);
      }
    },
    [subreddits, seed, isEndless]
  );

  const handleGuess = (selected: 'A' | 'B') => {
    if (hasGuessed || rounds.length === 0) return;

    const currentRound = rounds[currentRoundIndex];
    if (!currentRound) return;
    const selectedPost = selected === 'A' ? currentRound.postA : currentRound.postB;
    const otherPost = selected === 'A' ? currentRound.postB : currentRound.postA;
    const isCorrect = selectedPost.upvotes >= otherPost.upvotes;

    setRoundStatuses((prev) => {
      const next = [...prev];
      next[currentRoundIndex] = isCorrect ? 'correct' : 'wrong';
      return next;
    });
    setHasGuessed(true);

    const shouldPrefetch = isEndless ? isCorrect : true;
    if (shouldPrefetch && !prefetchedRound) {
      void prefetchNext(rounds);
    }
  };

  const handleNextRound = async () => {
    const currentStatus = roundStatuses[currentRoundIndex];

    if (isEndless && currentStatus === 'wrong') {
      setIsEndlessGameOver(true);
      return;
    }

    const isLastRound = !isEndless && currentRoundIndex + 1 >= TOTAL_ROUNDS;
    if (isLastRound) {
      setHasGuessed(false);
      setCurrentRoundIndex((prev) => prev + 1);
      return;
    }

    const nextIndex = currentRoundIndex + 1;
    if (nextIndex < rounds.length) {
      setHasGuessed(false);
      setCurrentRoundIndex(nextIndex);

      if (!prefetchedRound && !isPrefetchingRef.current) {
        void prefetchNext(rounds);
      }
      return;
    }

    let nextRound = prefetchedRound;

    if (!nextRound) {
      if (!isPrefetchingRef.current) {
        await prefetchNext(rounds);
      }
      return;
    }

    const updatedRounds = [...rounds, nextRound];
    setRounds(updatedRounds);
    setRoundStatuses((prev) => [...prev, 'unplayed']);
    setPrefetchedRound(null);
    setHasGuessed(false);
    setCurrentRoundIndex(nextIndex);

    void prefetchNext(updatedRounds);
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

    const correctCount = roundStatuses.filter((s) => s === 'correct').length;
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
  if (!currentRound) return null;
  const postA = currentRound.postA;
  const postB = currentRound.postB;

  const getPostStatus = (post: 'A' | 'B') => {
    if (!hasGuessed) return 'none' as const;
    const thisPost = post === 'A' ? postA : postB;
    const otherPost = post === 'A' ? postB : postA;
    return thisPost.upvotes >= otherPost.upvotes ? 'winner' as const : 'loser' as const;
  };

  const nextButtonBusy = hasGuessed && isPrefetching && !prefetchedRound && isEndless;
  const nextLabel = nextButtonBusy
    ? 'Loading...'
    : isEndless && roundStatuses[currentRoundIndex] === 'wrong'
      ? 'Score'
      : 'Next';

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
                ...new Array(Math.max(0, TOTAL_ROUNDS - roundStatuses.length)).fill('unplayed'),
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
              className={`pointer-events-auto ${styles.centerCircle} ${roundStatuses[currentRoundIndex] === 'correct'
                ? styles.circleCorrect
                : styles.circleWrong
                } ${nextButtonBusy ? styles.circleLoading : ''}`}
              onClick={!nextButtonBusy ? () => void handleNextRound() : undefined}
              role="button"
              tabIndex={0}
              aria-disabled={nextButtonBusy}
              onKeyDown={(e) => {
                if (!nextButtonBusy && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  void handleNextRound();
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
        <PostCard post={postA} onClick={() => handleGuess('A')} showUpvotes={hasGuessed} status={getPostStatus('A')} />
      </div>
      <div key={`right-${currentRoundIndex}`} className={`flex-1 min-h-0 w-full relative ${styles.fadeIn}`}>
        <PostCard post={postB} onClick={() => handleGuess('B')} showUpvotes={hasGuessed} status={getPostStatus('B')} />
      </div>
    </div>
  );
}
