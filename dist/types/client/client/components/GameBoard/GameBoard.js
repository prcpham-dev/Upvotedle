import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GameBoard.module.css';
import PostCard from '../PostCard/PostCard';
import RoundIndicator from '../RoundIndicator/RoundIndicator';
import { fetchRoundBatch } from '../../lib/roundFetcher';
const TOTAL_ROUNDS = 10;
function getUsedPostIds(rounds) {
    const ids = new Set();
    for (const r of rounds) {
        ids.add(r.postA.id);
        ids.add(r.postB.id);
    }
    return ids;
}
export default function GameBoard({ rounds: initialRounds = [], subreddits = [], seed = null, isEndless = false, onPlayAgain, }) {
    const hasInitialRounds = initialRounds.length > 0;
    const [rounds, setRounds] = useState(initialRounds);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [roundStatuses, setRoundStatuses] = useState(new Array(initialRounds.length).fill('unplayed'));
    const [hasGuessed, setHasGuessed] = useState(false);
    const [isEndlessGameOver, setIsEndlessGameOver] = useState(false);
    // Loading states — skip initial load if rounds were passed in from props
    const [isInitialLoading, setIsInitialLoading] = useState(!hasInitialRounds);
    const [loadError, setLoadError] = useState(null);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const isPrefetchingRef = useRef(false);
    useEffect(() => {
        if (hasInitialRounds)
            return; // skip — game.tsx already fetched them
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
                    count: isEndless ? 5 : 10,
                    startRound: 1,
                    seed: seed ?? Math.floor(Math.random() * 1_000_000),
                });
                if (cancelled)
                    return;
                setRounds(initial);
                setRoundStatuses(new Array(initial.length).fill('unplayed'));
            }
            catch (err) {
                if (cancelled)
                    return;
                setLoadError(err instanceof Error ? err.message : 'Failed to load rounds.');
            }
            finally {
                if (!cancelled)
                    setIsInitialLoading(false);
            }
        }
        void loadInitialRounds();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const fetchMoreEndlessRounds = useCallback(async (currentRounds) => {
        if (isPrefetchingRef.current)
            return;
        isPrefetchingRef.current = true;
        setIsPrefetching(true);
        const nextRoundNumber = currentRounds.length + 1;
        const usedIds = getUsedPostIds(currentRounds);
        try {
            const nextRounds = await fetchRoundBatch({
                subreddits,
                count: 2,
                startRound: nextRoundNumber,
                seed: seed ?? Math.floor(Math.random() * 1_000_000),
                usedPostIds: usedIds,
            });
            setRounds((prev) => [...prev, ...nextRounds]);
            setRoundStatuses((prev) => [...prev, ...new Array(nextRounds.length).fill('unplayed')]);
        }
        catch (err) {
            console.error('Failed to prefetch endless rounds:', err);
        }
        finally {
            isPrefetchingRef.current = false;
            setIsPrefetching(false);
        }
    }, [subreddits, seed]);
    const handleGuess = (selected) => {
        if (hasGuessed || rounds.length === 0)
            return;
        const currentRound = rounds[currentRoundIndex];
        if (!currentRound)
            return;
        const selectedPost = selected === 'A' ? currentRound.postA : currentRound.postB;
        const otherPost = selected === 'A' ? currentRound.postB : currentRound.postA;
        const isCorrect = selectedPost.upvotes >= otherPost.upvotes;
        setRoundStatuses((prev) => {
            const next = [...prev];
            next[currentRoundIndex] = isCorrect ? 'correct' : 'wrong';
            return next;
        });
        setHasGuessed(true);
        if (isEndless && isCorrect) {
            void fetchMoreEndlessRounds(rounds);
        }
    };
    const handleNextRound = async () => {
        const currentStatus = roundStatuses[currentRoundIndex];
        if (isEndless && currentStatus === 'wrong') {
            setIsEndlessGameOver(true);
            return;
        }
        const nextIndex = currentRoundIndex + 1;
        if (nextIndex < rounds.length) {
            setHasGuessed(false);
            setCurrentRoundIndex(nextIndex);
            return;
        }
    };
    if (isInitialLoading) {
        return (_jsxs("div", { className: styles.gameOverContainer, children: [_jsx("div", { className: "w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "mt-4 text-xl text-gray-300", children: "Loading rounds..." })] }));
    }
    if (loadError) {
        return (_jsxs("div", { className: styles.gameOverContainer, children: [_jsx("h2", { className: styles.gameOverTitle, children: "Failed to Load" }), _jsx("p", { className: styles.gameOverScore, children: loadError }), _jsx("button", { onClick: onPlayAgain, className: styles.gameOverButton, children: "Try Again" })] }));
    }
    const isGameOver = isEndless
        ? isEndlessGameOver
        : currentRoundIndex >= TOTAL_ROUNDS;
    if (isGameOver) {
        if (isEndless) {
            return (_jsxs("div", { className: styles.gameOverContainer, children: [_jsx("h2", { className: styles.gameOverTitle, children: "Endless Game Over!" }), _jsxs("p", { className: styles.gameOverScore, children: ["You completed ", currentRoundIndex, " rounds before failing!"] }), seed !== null && seed !== undefined && (_jsxs("p", { className: styles.gameOverSeed, children: ["Seed: ", _jsx("strong", { className: styles.highlightSeed, children: seed })] })), _jsx("button", { onClick: onPlayAgain, className: styles.gameOverButton, children: "Play Again" })] }));
        }
        const correctCount = roundStatuses.filter((s) => s === 'correct').length;
        return (_jsxs("div", { className: styles.gameOverContainer, children: [_jsx("h2", { className: styles.gameOverTitle, children: "Game Over!" }), _jsxs("p", { className: styles.gameOverScore, children: ["You got ", correctCount, " out of ", TOTAL_ROUNDS, " correct."] }), seed !== null && seed !== undefined && (_jsxs("p", { className: styles.gameOverSeed, children: ["Seed: ", _jsx("strong", { className: styles.highlightSeed, children: seed })] })), _jsx("button", { onClick: onPlayAgain, className: styles.gameOverButton, children: "Play Again" })] }));
    }
    if (rounds.length === 0 || currentRoundIndex >= rounds.length) {
        return (_jsxs("div", { className: styles.gameOverContainer, children: [_jsx("div", { className: "w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "mt-4 text-xl text-gray-300", children: "Loading next round..." })] }));
    }
    const currentRound = rounds[currentRoundIndex];
    if (!currentRound)
        return null;
    const postA = currentRound.postA;
    const postB = currentRound.postB;
    const getPostStatus = (post) => {
        if (!hasGuessed)
            return 'none';
        const thisPost = post === 'A' ? postA : postB;
        const otherPost = post === 'A' ? postB : postA;
        return thisPost.upvotes >= otherPost.upvotes ? 'winner' : 'loser';
    };
    const nextButtonBusy = hasGuessed && isPrefetching && (currentRoundIndex + 1 >= rounds.length) && isEndless;
    const nextLabel = nextButtonBusy
        ? 'Loading...'
        : isEndless && roundStatuses[currentRoundIndex] === 'wrong'
            ? 'Score'
            : 'Next';
    return (_jsxs("div", { className: `fixed inset-0 flex flex-col md:flex-row overflow-hidden ${styles.boardRoot}`, children: [_jsx("div", { className: `pointer-events-none z-50 ${styles.roundIndicatorContainer}`, children: _jsxs("div", { className: "pointer-events-auto flex flex-col items-center", children: [_jsxs("div", { className: styles.desktopHeaderInfo, children: [_jsxs("span", { className: styles.desktopRoundText, children: ["Round ", currentRound.round] }), _jsx("span", { className: styles.desktopSeparator, children: "\u2022" }), _jsx("span", { className: styles.desktopSubredditText, children: currentRound.subreddit })] }), !isEndless && (_jsx(RoundIndicator, { rounds: [
                                ...roundStatuses.slice(0, TOTAL_ROUNDS),
                                ...new Array(Math.max(0, TOTAL_ROUNDS - roundStatuses.length)).fill('unplayed'),
                            ] }))] }) }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none z-40", children: _jsxs("div", { className: styles.centerOverlayLayout, children: [_jsx("div", { className: styles.centerOverlaySideText, children: _jsxs("span", { className: styles.roundText, children: ["Round ", currentRound.round] }) }), hasGuessed ? (_jsx("div", { className: `pointer-events-auto ${styles.centerCircle} ${roundStatuses[currentRoundIndex] === 'correct'
                                ? styles.circleCorrect
                                : styles.circleWrong} ${nextButtonBusy ? styles.circleLoading : ''}`, onClick: !nextButtonBusy ? () => void handleNextRound() : undefined, role: "button", tabIndex: 0, "aria-disabled": nextButtonBusy, onKeyDown: (e) => {
                                if (!nextButtonBusy && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    void handleNextRound();
                                }
                            }, children: _jsx("span", { className: styles.vsText, children: nextLabel }) })) : (_jsx("div", { className: `pointer-events-auto ${styles.centerCircle}`, children: _jsx("span", { className: styles.vsText, children: "VS" }) })), _jsx("div", { className: styles.centerOverlaySideText, children: _jsx("span", { className: styles.subredditText, children: currentRound.subreddit }) })] }) }), _jsx("div", { className: `flex-1 min-h-0 w-full relative ${styles.leftCard} ${styles.fadeIn}`, children: _jsx(PostCard, { post: postA, onClick: () => handleGuess('A'), showUpvotes: hasGuessed, status: getPostStatus('A') }) }, `left-${currentRoundIndex}`), _jsx("div", { className: `flex-1 min-h-0 w-full relative ${styles.fadeIn}`, children: _jsx(PostCard, { post: postB, onClick: () => handleGuess('B'), showUpvotes: hasGuessed, status: getPostStatus('B') }) }, `right-${currentRoundIndex}`)] }));
}
//# sourceMappingURL=GameBoard.js.map