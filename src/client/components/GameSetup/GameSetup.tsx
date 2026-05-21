import React from 'react';
import styles from './GameSetup.module.css';
import type { CustomConfig } from '../../../shared/types/types';

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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Redditdle</h1>
      <p className={styles.subtitle}>Which post has more upvotes?</p>

      {error && (
        <div className={styles.errorBanner}>
          <p className={styles.errorTitle}>Can&apos;t load puzzle</p>
          <p className={styles.errorDesc}>{error}</p>
        </div>
      )}

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
    </div>
  );
}
