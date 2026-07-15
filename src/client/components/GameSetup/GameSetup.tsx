import React from 'react';
import styles from './GameSetup.module.css';
import type { CustomConfig } from '../../../shared/types/types';
import { getApiBase } from '../../../shared/lib/api';
import logoCircle from '../../../../public/logo_circle.png';
import otherGuy from '../../../../public/other_guy.png';
import someGuy from '../../../../public/some_guy.png';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface GameSetupProps {
  customConfig: CustomConfig;
  onConfigChange: (newConfig: Partial<CustomConfig>) => void;
  onStartDaily: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onStartCustom: (e: React.MouseEvent<HTMLButtonElement>) => void;
  error?: string;
}

export default function GameSetup({
  customConfig,
  onConfigChange,
  onStartDaily,
  onStartCustom,
  error,
}: GameSetupProps) {
  const { subreddit, seed } = customConfig;
  const [dailyResult, setDailyResult] = React.useState<{ correct: number; total: number; time: string } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = React.useState(false);
  const [leaderboard, setLeaderboard] = React.useState<{ username: string; points: number; time: number }[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = React.useState(false);

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    setShowLeaderboard(true);
    try {
      const res = await fetch(`${getApiBase()}/api/leaderboard?isDaily=true`);
      if (res.ok) {
        const data = await res.json() as { username: string; points: number; time: number }[];
        setDailyResult(null); // hide today's banner if showing leaderboard
        setLeaderboard(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  React.useEffect(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`upvotedle_daily_result_${today}`);
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDailyResult(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <img
        src={otherGuy}
        alt="illustration left"
        className={`${styles.illustration} ${styles.leftIllustration}`}
      />
      
      <div className={styles.container}>
        <div className={styles.titleContainer}>
          <img src={logoCircle} alt="Upvotedle Logo" className={styles.logo} />
          <h1 className={styles.title}>Upvotedle</h1>
        </div>
        <p className={styles.subtitle}>Which post has more upvotes?</p>

        {error && (
          <div className={styles.errorBanner}>
            <p className={styles.errorTitle}>Can&apos;t load puzzle</p>
            <p className={styles.errorDesc}>{error}</p>
          </div>
        )}

        {showLeaderboard ? (
          <div className={styles.leaderboardContainer}>
            <div className={styles.leaderboardHeader}>
              <h3 className={styles.leaderboardTitle}>Daily Leaderboard</h3>
              <button
                type="button"
                className={styles.closeLeaderboard}
                onClick={() => {
                  setShowLeaderboard(false);
                  // Reload dailyResult if there's one for today
                  const today = new Date().toDateString();
                  const saved = localStorage.getItem(`upvotedle_daily_result_${today}`);
                  if (saved) setDailyResult(JSON.parse(saved));
                }}
              >
                Back
              </button>
            </div>
            {isLoadingLeaderboard ? (
              <p className={styles.leaderboardStatus}>Loading leaderboard...</p>
            ) : leaderboard.length === 0 ? (
              <p className={styles.leaderboardStatus}>No entries yet today.</p>
            ) : (
              <div className={styles.leaderboardTableWrapper}>
                <table className={styles.leaderboardTable}>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>User</th>
                      <th>Score</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => (
                      <tr key={idx}>
                        <td className={styles.leaderboardRank}>#{idx + 1}</td>
                        <td className={styles.leaderboardUser}>{entry.username}</td>
                        <td>{entry.points}</td>
                        <td>{formatTime(entry.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Daily */}
            <button
              type="button"
              onClick={onStartDaily}
              className={`${styles.button} ${styles.dailyButton}`}
            >
              <span>Play Daily Puzzle</span>
              <span className={styles.iconMargin}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </span>
            </button>

            <button
              type="button"
              onClick={fetchLeaderboard}
              className={styles.leaderboardButton}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
              <span>View Daily Leaderboard</span>
            </button>

            {dailyResult && (
              <div className={styles.dailyResultBanner} style={{ marginTop: '10px', marginBottom: '8px' }}>
                <span className={styles.dailyResultLabel}>Today&apos;s Result:</span>{' '}
                <strong className={styles.dailyResultValue}>
                  {dailyResult.correct}/{dailyResult.total}
                </strong>{' '}
                in{' '}
                <strong className={styles.dailyResultValue}>{dailyResult.time}</strong>
              </div>
            )}

            <div className={styles.dividerContainer}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>CUSTOM</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Custom form */}
            <form onSubmit={(e) => e.preventDefault()} className={styles.customForm}>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Subreddit</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      value={subreddit}
                      onChange={(e) => onConfigChange({ subreddit: e.target.value })}
                      placeholder="memes (blank = random)"
                      className={styles.input}
                    />
                    {subreddit && (
                      <button type="button" className={styles.clearButton} onClick={() => onConfigChange({ subreddit: '' })} aria-label="Clear subreddit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Seed</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      value={seed}
                      onChange={(e) => onConfigChange({ seed: e.target.value.replace(/\D/g, '') })}
                      placeholder="42 (blank = random)"
                      className={styles.input}
                    />
                    {seed && (
                      <button type="button" className={styles.clearButton} onClick={() => onConfigChange({ seed: '' })} aria-label="Clear seed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.actionRow}>
                <button
                  type="submit"
                  className={styles.playButton}
                  onClick={(e) => { e.preventDefault(); onStartCustom(e); }}
                >
                  <span>Play Custom Game</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <img
        src={someGuy}
        alt="illustration right"
        className={`${styles.illustration} ${styles.rightIllustration}`}
      />
    </div>
  );
}
