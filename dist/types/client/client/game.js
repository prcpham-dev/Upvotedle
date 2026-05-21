import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './index.css';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import GameSetup from './components/GameSetup/GameSetup';
import GameBoard from './components/GameBoard/GameBoard';
import { DAILY_SUBREDDITS } from '../shared/lib/reddit/dailySubreddits';
import { pickSeededSample } from '../shared/lib/reddit/seededRandom';
import { fetchRoundBatch } from './lib/roundFetcher';
import { getApiBase } from '../shared/lib/api';
function resolveSeed(seedStr) {
    const parsed = Number.parseInt(seedStr.trim(), 10);
    return Number.isFinite(parsed) ? parsed : Math.floor(Math.random() * 1_000_000);
}
function buildCandidateList(subreddit, seed) {
    if (subreddit.trim())
        return [subreddit.trim()];
    const pool = [...DAILY_SUBREDDITS];
    return pickSeededSample(pool, pool.length, seed);
}
function App() {
    const [gameState, setGameState] = useState('setup');
    const [rounds, setRounds] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [customConfig, setCustomConfig] = useState({
        subreddit: '',
        seed: '',
        isEndless: false,
    });
    const [currentRunSeed, setCurrentRunSeed] = useState(null);
    const [subreddits, setSubreddits] = useState([]);
    // Restore inputs from localStorage on mount
    useEffect(() => {
        const subreddit = localStorage.getItem('redditdle_custom_subreddit') ?? '';
        const seed = localStorage.getItem('redditdle_custom_seed') ?? '';
        setCustomConfig({ subreddit, seed, isEndless: false });
        const startGame = localStorage.getItem('redditdle_start_game');
        if (startGame === 'true') {
            localStorage.removeItem('redditdle_start_game');
            const mode = localStorage.getItem('redditdle_game_mode');
            if (mode === 'daily') {
                void handleStartDaily();
            }
            else {
                void handleStartCustom(subreddit, seed);
            }
        }
    }, []);
    const handleConfigChange = (newConfig) => {
        setCustomConfig((prev) => {
            if (newConfig.subreddit !== undefined)
                localStorage.setItem('redditdle_custom_subreddit', newConfig.subreddit);
            if (newConfig.seed !== undefined)
                localStorage.setItem('redditdle_custom_seed', newConfig.seed);
            return { ...prev, ...newConfig };
        });
    };
    const handleStartDaily = async () => {
        setGameState('loading');
        setErrorMessage('');
        setSubreddits([]);
        setCurrentRunSeed(null);
        try {
            const res = await fetch(`${getApiBase()}/api/daily`);
            const json = await res.json();
            if (!res.ok) {
                throw new Error(typeof json.message === 'string'
                    ? json.message
                    : 'Failed to fetch daily puzzle.');
            }
            setRounds(json);
            setGameState('playing');
        }
        catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
            setGameState('error');
        }
    };
    const handleStartCustom = async (customSubreddit, customSeed) => {
        const subreddit = customSubreddit ?? customConfig.subreddit;
        const seedStr = customSeed ?? customConfig.seed;
        setGameState('loading');
        setErrorMessage('');
        const resolvedSeed = resolveSeed(seedStr);
        setCurrentRunSeed(resolvedSeed);
        const candidates = buildCandidateList(subreddit, resolvedSeed);
        setSubreddits(candidates);
        try {
            const firstBatch = await fetchRoundBatch({
                subreddits: candidates,
                count: 10,
                startRound: 1,
                seed: resolvedSeed,
            });
            setRounds(firstBatch);
            setGameState('playing');
        }
        catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
            setGameState('error');
        }
    };
    const handlePlayAgain = () => {
        setGameState('setup');
        setRounds([]);
        setSubreddits([]);
    };
    const showSetup = gameState === 'setup' || gameState === 'error';
    return (_jsxs("main", { className: "min-h-screen flex flex-col items-center justify-center p-4 setup-bg", children: [showSetup && (_jsx(GameSetup, { customConfig: customConfig, onConfigChange: handleConfigChange, onStartDaily: () => void handleStartDaily(), onStartCustom: () => void handleStartCustom(), error: errorMessage })), gameState === 'loading' && (_jsxs("div", { className: "flex flex-col items-center justify-center", children: [_jsx("div", { className: "w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "mt-4 text-xl text-gray-300", children: "Fetching Reddit Posts..." })] })), gameState === 'playing' && (_jsx(GameBoard, { rounds: rounds, onPlayAgain: handlePlayAgain, isEndless: false, subreddits: subreddits, seed: currentRunSeed }))] }));
}
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
//# sourceMappingURL=game.js.map