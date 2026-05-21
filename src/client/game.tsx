import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import GameSetup from './components/GameSetup/GameSetup';
import GameBoard from './components/GameBoard/GameBoard';
import { DAILY_SUBREDDITS } from '../shared/lib/reddit/dailySubreddits';
import { pickSeededSample } from '../shared/lib/reddit/seededRandom';
import { fetchRoundBatch, BATCH_SIZE } from './lib/roundFetcher';
import { getApiBase } from '../shared/lib/api';
import type { RoundData } from './types/types';

function resolveSeed(seedStr: string): number {
  const parsed = Number.parseInt(seedStr.trim(), 10);
  return Number.isFinite(parsed) ? parsed : Math.floor(Math.random() * 1_000_000);
}

function buildCandidateList(subreddit: string, seed: number): string[] {
  if (subreddit.trim()) return [subreddit.trim()];
  const pool = [...DAILY_SUBREDDITS];
  return pickSeededSample(pool, pool.length, seed);
}

function App() {
  const [gameState, setGameState] = useState<'setup' | 'loading' | 'playing' | 'error'>('setup');
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [customConfig, setCustomConfig] = useState({
    subreddit: '',
    seed: '',
    isEndless: false,
  });
  const [isEndless, setIsEndless] = useState(false);
  const [currentRunSeed, setCurrentRunSeed] = useState<number | null>(null);
  const [subreddits, setSubreddits] = useState<string[]>([]);

  // Restore inputs from localStorage on mount
  useEffect(() => {
    const subreddit = localStorage.getItem('redditdle_custom_subreddit') ?? '';
    const seed = localStorage.getItem('redditdle_custom_seed') ?? '';
    const isEndless = localStorage.getItem('redditdle_custom_endless') === 'true';
    setCustomConfig({ subreddit, seed, isEndless });

    const startGame = localStorage.getItem('redditdle_start_game');
    if (startGame === 'true') {
      localStorage.removeItem('redditdle_start_game');
      const mode = localStorage.getItem('redditdle_game_mode');
      if (mode === 'daily') {
        void handleStartDaily();
      } else {
        void handleStartCustom(subreddit, seed, isEndless);
      }
    }
  }, []);

  const handleConfigChange = (newConfig: Partial<typeof customConfig>) => {
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
    setIsEndless(false);
    setSubreddits([]);
    setCurrentRunSeed(null);

    try {
      const res = await fetch(`${getApiBase()}/api/daily`);
      const json = await res.json() as unknown;

      if (!res.ok) {
        throw new Error(
          typeof (json as { message?: string }).message === 'string'
            ? (json as { message: string }).message
            : 'Failed to fetch daily puzzle.',
        );
      }

      setRounds(json as RoundData[]);
      setGameState('playing');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setGameState('error');
    }
  };

  const handleStartCustom = async (
    customSubreddit?: string,
    customSeed?: string,
    customEndless?: boolean,
  ) => {
    const subreddit = customSubreddit ?? customConfig.subreddit;
    const seedStr = customSeed ?? customConfig.seed;
    const endless = customEndless ?? customConfig.isEndless;

    setGameState('loading');
    setErrorMessage('');
    setIsEndless(endless);

    const resolvedSeed = resolveSeed(seedStr);
    setCurrentRunSeed(resolvedSeed);

    const candidates = buildCandidateList(subreddit, resolvedSeed);
    setSubreddits(candidates);

    try {
      const firstBatch = await fetchRoundBatch({
        subreddits: candidates,
        count: BATCH_SIZE,
        startRound: 1,
        seed: resolvedSeed,
      });

      setRounds(firstBatch);
      setGameState('playing');
    } catch (err: unknown) {
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 setup-bg">
      {showSetup && (
        <GameSetup
          customConfig={customConfig}
          onConfigChange={handleConfigChange}
          onStartDaily={() => void handleStartDaily()}
          onStartCustom={() => void handleStartCustom()}
          error={errorMessage}
        />
      )}

      {gameState === 'loading' && (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#ff4500] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-xl text-gray-300">Fetching Reddit Posts...</p>
        </div>
      )}

      {gameState === 'playing' && (
        <GameBoard
          rounds={rounds}
          onPlayAgain={handlePlayAgain}
          isEndless={isEndless}
          subreddits={subreddits}
          seed={currentRunSeed}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
