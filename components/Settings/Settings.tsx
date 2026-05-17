"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  DEFAULT_MAX_UPVOTES,
  DEFAULT_MIN_UPVOTES,
  MAX_UPVOTES_LIMIT,
  hasMaxUpvoteCap,
} from "@/lib/reddit/constants";
import {
  clampMaxUpvotes,
  clampMinUpvotes,
} from "@/lib/reddit/parseMaxUpvotes";
import type { UpvoteLimits } from "@/lib/settings";
import styles from "./Settings.module.css";

interface SettingsProps {
  isOpen: boolean;
  upvoteLimits: UpvoteLimits;
  onClose: () => void;
  onSave: (limits: UpvoteLimits) => void;
}

export default function Settings({
  isOpen,
  upvoteLimits,
  onClose,
  onSave,
}: SettingsProps) {
  const [minDraft, setMinDraft] = useState(String(upvoteLimits.minUpvotes));
  const [maxDraft, setMaxDraft] = useState(String(upvoteLimits.maxUpvotes));

  useEffect(() => {
    if (isOpen) {
      setMinDraft(String(upvoteLimits.minUpvotes));
      setMaxDraft(String(upvoteLimits.maxUpvotes));
    }
  }, [isOpen, upvoteLimits]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    const parsedMin = Number.parseInt(minDraft, 10);
    const parsedMax = Number.parseInt(maxDraft, 10);
    const minUpvotes = clampMinUpvotes(
      Number.isFinite(parsedMin) ? parsedMin : DEFAULT_MIN_UPVOTES,
    );
    let maxUpvotes = clampMaxUpvotes(
      Number.isFinite(parsedMax) ? parsedMax : DEFAULT_MAX_UPVOTES,
    );
    if (hasMaxUpvoteCap(maxUpvotes) && minUpvotes > maxUpvotes) {
      maxUpvotes = minUpvotes;
    }
    onSave({ minUpvotes, maxUpvotes });
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
          Control which posts can appear based on upvote count. Set a minimum to
          exclude low-vote posts, and a maximum to exclude viral posts.
        </p>

        <label className={styles.label} htmlFor="min-upvotes">
          Minimum upvotes per post
        </label>
        <input
          id="min-upvotes"
          type="number"
          min={0}
          max={MAX_UPVOTES_LIMIT}
          step={1}
          value={minDraft}
          onChange={(e) => setMinDraft(e.target.value)}
          className={styles.input}
        />
        <p className={styles.hint}>
          Default: {DEFAULT_MIN_UPVOTES.toLocaleString()}. Posts below this are
          excluded (e.g. 1000 hides posts with 500 upvotes).
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
          value={maxDraft}
          onChange={(e) => setMaxDraft(e.target.value)}
          className={styles.input}
        />
        <p className={styles.hint}>
          Default: No limit. Set to {MAX_UPVOTES_LIMIT.toLocaleString()} or lower
          to exclude viral posts (e.g. 1000 hides posts with 5,000 upvotes).
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
