"use client";

import React, { useState } from "react";
import styles from "./GameSetup.module.css";
import Settings from "@/components/Settings/Settings";
import type { UpvoteLimits } from "@/lib/settings";

interface GameSetupProps {
  upvoteLimits: UpvoteLimits;
  onStartDaily: () => void;
  onStartCustom: (subreddits: string[], isEndless: boolean, seed: number | null) => void;
  onUpvoteLimitsChange: (limits: UpvoteLimits) => void;
  error?: string;
}

export default function GameSetup({
  upvoteLimits,
  onStartDaily,
  onStartCustom,
  onUpvoteLimitsChange,
  error,
}: GameSetupProps) {
  const [subredditMode, setSubredditMode] = useState<"custom" | "random">("custom");
  const [singleSubreddit, setSingleSubreddit] = useState("");
  const [seedInput, setSeedInput] = useState("");
  const [isEndless, setIsEndless] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subredditMode === "custom") {
      if (singleSubreddit.trim()) {
        onStartCustom([singleSubreddit.trim()], isEndless, null);
      }
    } else {
      const parsedSeed = Number.parseInt(seedInput, 10);
      const seed = Number.isFinite(parsedSeed) ? parsedSeed : Math.floor(Math.random() * 1000000);
      onStartCustom([], isEndless, seed);
    }
  };

  const isFormValid =
    subredditMode === "custom"
      ? singleSubreddit.trim().length > 0
      : seedInput.trim().length > 0;

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
          {/* Subreddit Mode Segmented Control */}
          <div className={styles.segmentedControl}>
            <button
              type="button"
              className={`${styles.segmentButton} ${
                subredditMode === "custom" ? styles.segmentActive : ""
              }`}
              onClick={() => setSubredditMode("custom")}
            >
              Custom Subreddit
            </button>
            <button
              type="button"
              className={`${styles.segmentButton} ${
                subredditMode === "random" ? styles.segmentActive : ""
              }`}
              onClick={() => setSubredditMode("random")}
            >
              Random (Seeded)
            </button>
          </div>

          {/* Conditional Input Rendering */}
          {subredditMode === "custom" ? (
            <input
              type="text"
              value={singleSubreddit}
              onChange={(e) => setSingleSubreddit(e.target.value)}
              placeholder="Enter a custom subreddit (e.g., memes)"
              className={styles.input}
              required={subredditMode === "custom"}
            />
          ) : (
            <input
              type="number"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="Enter a numerical seed (e.g., 42)"
              className={styles.input}
              required={subredditMode === "random"}
            />
          )}

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
            disabled={!isFormValid}
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
