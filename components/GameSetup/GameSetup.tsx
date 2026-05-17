"use client";

import React, { useState } from "react";
import styles from "./GameSetup.module.css";

interface GameSetupProps {
  onStartDaily: () => void;
  onStartCustom: (subreddit: string) => void;
  error?: string;
}

export default function GameSetup({ onStartDaily, onStartCustom, error }: GameSetupProps) {
  const [subreddit, setSubreddit] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subreddit.trim()) {
      onStartCustom(subreddit.trim());
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Redditdle</h1>
      <p className={styles.subtitle}>Which post has more upvotes?</p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4">
          <p className="text-red-400 font-medium">Can't find the reddit page</p>
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
        <input
          type="text"
          value={subreddit}
          onChange={(e) => setSubreddit(e.target.value)}
          placeholder="Enter a custom subreddit (e.g., memes)"
          className={styles.input}
          required
        />
        
        <button 
          type="submit" 
          className={`${styles.button} flex flex-row items-center justify-center`}
          disabled={!subreddit.trim()}
        >
          <span>Play Custom Subreddit</span>
          <span className={styles.iconMargin}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
          </span>
        </button>
      </form>
    </div>
  );
}
