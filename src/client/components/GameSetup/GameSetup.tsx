import React, { useState } from 'react';
import styles from './GameSetup.module.css';
import Settings from '../Settings/Settings';
import type { UpvoteLimits } from '../../../shared/lib/settings';
import type { CustomConfig } from '../../../shared/types/types';

interface GameSetupProps {
  upvoteLimits: UpvoteLimits;
  customConfig: CustomConfig;
  onConfigChange: (newConfig: Partial<CustomConfig>) => void;
  onStartDaily: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onStartCustom: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onUpvoteLimitsChange: (limits: UpvoteLimits) => void;
  error?: string;
}

export default function GameSetup({
  upvoteLimits,
  customConfig,
  onConfigChange,
  onStartDaily,
  onStartCustom,
  onUpvoteLimitsChange,
  error,
}: GameSetupProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { subreddit, seed, isEndless } = customConfig;


  return (
    <>
      <div className={styles.container}>
        {/* Settings gear */}
        <button
          type="button"
          className={styles.settingsButton}
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

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
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
          </span>
        </button>

        <div className={styles.dividerContainer}>
          <div className={styles.dividerLine}/>
          <span className={styles.dividerText}>CUSTOM</span>
          <div className={styles.dividerLine}/>
        </div>

        {/* Custom form */}
        <form onSubmit={(e) => e.preventDefault()} className={styles.customForm}>
          {/* Two inputs side by side */}
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
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Endless toggle + Play button on same row */}
          <div className={styles.actionRow}>
            <label className={styles.endlessToggle}>
              <input
                type="checkbox"
                checked={isEndless}
                onChange={(e) => onConfigChange({ isEndless: e.target.checked })}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}/>
              <span className={styles.endlessLabel}>Endless</span>
            </label>

            <button
              type="submit"
              className={styles.playButton}
              onClick={(e) => {
                e.preventDefault();
                onStartCustom(e);
              }}
            >
              <span>Play</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: 6}}>
                <polygon points="6 3 20 12 6 21 6 3"/>
              </svg>
            </button>
          </div>
        </form>
      </div>

      <Settings
        isOpen={settingsOpen}
        upvoteLimits={upvoteLimits}
        onClose={() => setSettingsOpen(false)}
        onSave={onUpvoteLimitsChange}
      />
    </>
  );
}
