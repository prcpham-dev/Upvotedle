"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DEFAULT_MAX_UPVOTES, MAX_UPVOTES_LIMIT } from "@/lib/reddit/constants";
import { clampMaxUpvotes } from "@/lib/reddit/parseMaxUpvotes";
import styles from "./Settings.module.css";

interface SettingsProps {
  isOpen: boolean;
  maxUpvotes: number;
  onClose: () => void;
  onSave: (maxUpvotes: number) => void;
}

export default function Settings({
  isOpen,
  maxUpvotes,
  onClose,
  onSave,
}: SettingsProps) {
  const [draft, setDraft] = useState(String(maxUpvotes));

  useEffect(() => {
    if (isOpen) {
      setDraft(String(maxUpvotes));
    }
  }, [isOpen, maxUpvotes]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    const parsed = Number.parseInt(draft, 10);
    onSave(clampMaxUpvotes(Number.isFinite(parsed) ? parsed : DEFAULT_MAX_UPVOTES));
    onClose();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={handleOverlayClick}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 id="settings-title" className={styles.title}>
            Settings
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <p className={styles.description}>
          Only posts with up to this many upvotes can appear in a round. Lower
          values favor smaller posts; higher values include more popular posts.
        </p>

        <label className={styles.label} htmlFor="max-upvotes">
          Maximum upvotes per post
        </label>
        <input
          id="max-upvotes"
          type="number"
          min={1}
          max={MAX_UPVOTES_LIMIT}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={styles.input}
        />
        <p className={styles.hint}>
          Default: {DEFAULT_MAX_UPVOTES.toLocaleString()}. Allowed range: 1–
          {MAX_UPVOTES_LIMIT.toLocaleString()}.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.saveButton} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
