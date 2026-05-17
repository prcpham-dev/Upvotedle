"use client";

import React, { useState } from "react";
import styles from "./GameSetup.module.css";
import { Play, Calendar } from "lucide-react";

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
          <Calendar size={20} />
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
            <Play size={20} />
          </span>
        </button>
      </form>
    </div>
  );
}
