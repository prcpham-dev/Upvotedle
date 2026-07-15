import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './GameBoard.module.css';
import PostCard from '../PostCard/PostCard';
import otherGuy from '../../../../public/other_guy.png';
import someGuy from '../../../../public/some_guy.png';
import RoundIndicator from '../RoundIndicator/RoundIndicator';
import { fetchRoundBatch } from '../../lib/roundFetcher';
import { getApiBase } from '../../../shared/lib/api';
const TOTAL_ROUNDS = 10;
function getUsedPostIds(rounds) {
    const ids = new Set();
    for (const r of rounds) {
        ids.add(r.postA.id);
        ids.add(r.postB.id);
    }
    return ids;
}
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
export default function GameBoard({ rounds: initialRounds = [], subreddits = [], seed = null, isEndless = false, onPlayAgain, isDaily = false, }) {
    const hasInitialRounds = initialRounds.length > 0;
    const [rounds, setRounds] = useState(initialRounds);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [roundStatuses, setRoundStatuses] = useState(new Array(initialRounds.length).fill('unplayed'));
    const [hasGuessed, setHasGuessed] = useState(false);
    const [isEndlessGameOver, setIsEndlessGameOver] = useState(false);
    const [startTime] = useState(() => Date.now());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
    // Loading states — skip initial load if rounds were passed in from props
    const [isInitialLoading, setIsInitialLoading] = useState(!hasInitialRounds);
    const [loadError, setLoadError] = useState(null);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const isPrefetchingRef = useRef(false);
    const isGameOver = isEndless
        ? isEndlessGameOver
        : currentRoundIndex >= TOTAL_ROUNDS;
    useEffect(() => {
        if (isInitialLoading || isGameOver)
            return;
        const timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [isInitialLoading, isGameOver, startTime]);
    useEffect(() => {
        if (isGameOver && !isEndless) {
            const correctCount = roundStatuses.filter((s) => s === 'correct').length;
            const today = new Date().toDateString();
            if (isDaily) {
                const existing = localStorage.getItem(`upvotedle_daily_result_${today}`);
                if (!existing) {
                    localStorage.setItem(`upvotedle_daily_result_${today}`, JSON.stringify({
                        correct: correctCount,
                        total: TOTAL_ROUNDS,
                        time: formatTime(elapsedTime),
                    }));
                }
            }
            // Submit score to Redis and fetch leaderboard
            const submitAndFetch = async () => {
                setIsLoadingLeaderboard(true);
                try {
                    // Submit score
                    await fetch(`${getApiBase()}/api/leaderboard/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: correctCount, time: elapsedTime, isDaily }),
                    });
                    // Fetch leaderboard
                    const res = await fetch(`${getApiBase()}/api/leaderboard?isDaily=${isDaily}`);
                    if (res.ok) {
                        const data = await res.json();
                        setLeaderboard(data);
                    }
                }
                catch (e) {
                    console.error('[leaderboard] Failed:', e);
                }
                finally {
                    setIsLoadingLeaderboard(false);
                }
            };
            void submitAndFetch();
        }
    }, [isGameOver, isDaily, isEndless, roundStatuses, elapsedTime]);
    useEffect(() => {
        if (hasInitialRounds)
            return; // skip — game.tsx already fetched them
        /* eslint-disable react-hooks/set-state-in-effect */
        if (!subreddits.length) {
            setLoadError('No subreddits configured.');
            setIsInitialLoading(false);
            return;
        }
        /* eslint-enable react-hooks/set-state-in-effect */
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
        setHasGuessed(false);
        setCurrentRoundIndex(nextIndex);
    };
    if (isInitialLoading) {
        return (_jsxs("div", { className: styles.gameOverContainer, children: [_jsx("div", { className: "w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "mt-4 text-xl text-gray-300", children: "Loading rounds..." })] }));
    }
    if (loadError) {
        return (_jsxs("div", { className: styles.gameOverContainer, children: [_jsx("h2", { className: styles.gameOverTitle, children: "Failed to Load" }), _jsx("p", { className: styles.gameOverScore, children: loadError }), _jsx("button", { onClick: onPlayAgain, className: styles.gameOverButton, children: "Try Again" })] }));
    }
    if (isGameOver) {
        if (isEndless) {
            return (_jsxs("div", { className: styles.gameOverContainer, children: [_jsx("h2", { className: styles.gameOverTitle, children: "Endless Game Over!" }), _jsxs("p", { className: styles.gameOverScore, children: ["You completed ", currentRoundIndex, " rounds before failing!"] }), _jsxs("p", { className: styles.gameOverScore, style: { marginTop: '0.25rem' }, children: ["Time Played: ", _jsx("strong", { children: formatTime(elapsedTime) })] }), seed !== null && seed !== undefined && (_jsxs("p", { className: styles.gameOverSeed, children: ["Seed: ", _jsx("strong", { className: styles.highlightSeed, children: seed })] })), _jsx("button", { onClick: onPlayAgain, className: styles.gameOverButton, children: "Play Again" })] }));
        }
        const correctCount = roundStatuses.filter((s) => s === 'correct').length;
        return (_jsxs("div", { className: styles.pageWrapper, children: [_jsx("img", { src: otherGuy, alt: "illustration left", className: `${styles.illustration} ${styles.leftIllustration}` }), _jsxs("div", { className: styles.gameOverContainer, children: [_jsx("h2", { className: styles.gameOverTitle, children: "Game Over!" }), _jsxs("p", { className: styles.gameOverScore, style: { marginBottom: '8px' }, children: ["You got ", correctCount, " out of ", TOTAL_ROUNDS, " correct."] }), _jsxs("p", { className: styles.gameOverScore, style: { marginTop: '0.25rem', marginBottom: '24px' }, children: ["Time: ", _jsx("strong", { children: formatTime(elapsedTime) })] }), (isDaily || !isEndless) && (_jsxs("div", { className: styles.leaderboardSection, children: [_jsx("h3", { className: styles.leaderboardTitle, children: isDaily ? "Today's Leaderboard" : "Custom Leaderboard" }), isLoadingLeaderboard ? (_jsx("p", { className: styles.leaderboardStatus, children: "Loading leaderboard..." })) : leaderboard.length === 0 ? (_jsx("p", { className: styles.leaderboardStatus, children: "No entries yet." })) : (_jsx("div", { className: styles.leaderboardTableWrapper, children: _jsxs("table", { className: styles.leaderboardTable, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Rank" }), _jsx("th", { children: "User" }), _jsx("th", { children: "Score" }), _jsx("th", { children: "Time" })] }) }), _jsx("tbody", { children: leaderboard.map((entry, idx) => (_jsxs("tr", { children: [_jsxs("td", { className: styles.leaderboardRank, children: ["#", idx + 1] }), _jsx("td", { className: styles.leaderboardUser, children: entry.username }), _jsx("td", { children: entry.points }), _jsx("td", { children: formatTime(entry.time) })] }, idx))) })] }) }))] })), seed !== null && seed !== undefined && (_jsxs("p", { className: styles.gameOverSeed, children: ["Seed: ", _jsx("strong", { className: styles.highlightSeed, children: seed })] })), _jsx("button", { onClick: onPlayAgain, className: styles.gameOverButton, style: { marginTop: '24px' }, children: "Play Again" })] }), _jsx("img", { src: someGuy, alt: "illustration right", className: `${styles.illustration} ${styles.rightIllustration}` })] }));
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
    return (_jsxs("div", { className: `fixed inset-0 overflow-y-auto overflow-x-hidden md:overflow-hidden ${styles.boardRoot}`, children: [_jsx("div", { className: styles.mobileTimerBadge, children: formatTime(elapsedTime) }), _jsxs("div", { className: "relative flex flex-col md:flex-row min-h-[100dvh] w-full", children: [_jsx("div", { className: `pointer-events-none z-50 ${styles.roundIndicatorContainer}`, children: _jsxs("div", { className: "pointer-events-auto flex flex-col items-center", children: [_jsxs("div", { className: styles.desktopHeaderInfo, children: [_jsxs("span", { className: styles.desktopRoundText, children: ["Round ", currentRound.round] }), _jsx("span", { className: styles.desktopSeparator, children: "\u2022" }), _jsx("span", { className: styles.desktopSubredditText, children: currentRound.subreddit }), _jsx("span", { className: styles.desktopSeparator, children: "\u2022" }), _jsx("span", { className: styles.desktopTimerText, children: formatTime(elapsedTime) })] }), !isEndless && (_jsx(RoundIndicator, { rounds: [
                                        ...roundStatuses.slice(0, TOTAL_ROUNDS),
                                        ...new Array(Math.max(0, TOTAL_ROUNDS - roundStatuses.length)).fill('unplayed'),
                                    ] }))] }) }), _jsx("div", { className: `${styles.centerOverlay} pointer-events-none z-40`, children: _jsxs("div", { className: styles.centerOverlayLayout, children: [_jsx("div", { className: styles.centerOverlaySideText, children: _jsxs("span", { className: styles.roundText, children: ["Round ", currentRound.round] }) }), hasGuessed ? (_jsx("div", { className: `pointer-events-auto ${styles.centerCircle} ${roundStatuses[currentRoundIndex] === 'correct'
                                        ? styles.circleCorrect
                                        : styles.circleWrong} ${nextButtonBusy ? styles.circleLoading : ''}`, onClick: !nextButtonBusy ? () => void handleNextRound() : undefined, role: "button", tabIndex: 0, "aria-disabled": nextButtonBusy, onKeyDown: (e) => {
                                        if (!nextButtonBusy && (e.key === 'Enter' || e.key === ' ')) {
                                            e.preventDefault();
                                            void handleNextRound();
                                        }
                                    }, children: _jsx("span", { className: styles.vsText, children: nextLabel }) })) : (_jsx("div", { className: `pointer-events-auto ${styles.centerCircle}`, children: _jsx("span", { className: styles.vsText, children: "VS" }) })), _jsx("div", { className: styles.centerOverlaySideText, children: _jsx("span", { className: styles.subredditText, children: currentRound.subreddit }) })] }) }), _jsx("div", { className: `flex flex-col w-full min-h-[42vh] relative md:flex-1 md:min-h-0 ${styles.leftCard} ${styles.fadeIn}`, children: _jsx(PostCard, { post: postA, onClick: () => handleGuess('A'), showUpvotes: hasGuessed, status: getPostStatus('A') }) }, `left-${currentRoundIndex}`), _jsxs("div", { className: styles.mobileDivider, children: [_jsxs("span", { className: styles.mobileDividerRound, children: ["Round ", currentRound.round] }), hasGuessed ? (_jsx("div", { className: `${styles.centerCircle} ${roundStatuses[currentRoundIndex] === 'correct'
                                    ? styles.circleCorrect
                                    : styles.circleWrong} ${nextButtonBusy ? styles.circleLoading : ''}`, onClick: !nextButtonBusy ? () => void handleNextRound() : undefined, role: "button", tabIndex: 0, "aria-disabled": nextButtonBusy, onKeyDown: (e) => {
                                    if (!nextButtonBusy && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        void handleNextRound();
                                    }
                                }, children: _jsx("span", { className: styles.vsText, children: nextLabel }) })) : (_jsx("div", { className: styles.centerCircle, children: _jsx("span", { className: styles.vsText, children: "VS" }) })), _jsx("span", { className: styles.mobileDividerSubreddit, children: currentRound.subreddit })] }), _jsx("div", { className: `flex flex-col w-full min-h-[42vh] relative md:flex-1 md:min-h-0 ${styles.fadeIn}`, children: _jsx(PostCard, { post: postB, onClick: () => handleGuess('B'), showUpvotes: hasGuessed, status: getPostStatus('B') }) }, `right-${currentRoundIndex}`)] })] }));
}
//# sourceMappingURL=GameBoard.js.map