"use client";

import React, { useState } from "react";
import styles from "./GameSetup.module.css";
import Settings from "@/components/Settings/Settings";
import type { UpvoteLimits } from "@/lib/settings";

interface GameSetupProps {
  upvoteLimits: UpvoteLimits;
  customSubreddit: string;
  setCustomSubreddit: (val: string) => void;
  customSeed: string;
  setCustomSeed: (val: string) => void;
  isEndless: boolean;
  setIsEndless: (val: boolean) => void;
  onStartDaily: () => void;
  onStartCustom: (subreddit: string, seed: string, isEndless: boolean) => void;
  onUpvoteLimitsChange: (limits: UpvoteLimits) => void;
  error?: string;
}

export default function GameSetup({
  upvoteLimits,
  customSubreddit,
  setCustomSubreddit,
  customSeed,
  setCustomSeed,
  isEndless,
  setIsEndless,
  onStartDaily,
  onStartCustom,
  onUpvoteLimitsChange,
  error,
}: GameSetupProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartCustom(customSubreddit, customSeed, isEndless);
  };

  return (
    <>
      <div className={styles.container}>
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
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-center">
            <p className="text-red-400 font-medium">Can&apos;t find the reddit page</p>
            <p className="text-red-400/70 text-sm mt-1">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onStartDaily}
          className={`${styles.button} ${styles.dailyButton} flex flex-row items-center justify-center`}
        >
          <span>Play Daily Puzzle</span>
          <span className={styles.iconMargin}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
          </span>
        </button>

        <div className={styles.dividerContainer}>
          <div className={styles.dividerLine}></div>
          <span className={styles.dividerText}>OR</span>
          <div className={styles.dividerLine}></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Custom Subreddit (Optional) */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Subreddit Name (Optional)</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={customSubreddit}
                onChange={(e) => setCustomSubreddit(e.target.value)}
                placeholder="e.g. memes (blank for random)"
                className={styles.input}
              />
              {customSubreddit && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setCustomSubreddit("")}
                  aria-label="Clear subreddit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Seed Input (Optional, numeric only, no arrow spinner buttons) */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Seed Number (Optional)</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 42 (blank for random)"
                className={styles.input}
              />
              {customSeed && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setCustomSeed("")}
                  aria-label="Clear seed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Endless Mode Toggle Switch */}
          <div className={styles.toggleContainer}>
            <span className={styles.toggleLabel}>Endless Mode (Sudden Death)</span>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={isEndless}
                onChange={(e) => setIsEndless(e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>

          <button
            type="submit"
            className={`${styles.button} flex flex-row items-center justify-center`}
          >
            <span>Play Custom Game</span>
            <span className={styles.iconMargin}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="6 3 20 12 6 21 6 3"/>
              </svg>
            </span>
          </button>
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
