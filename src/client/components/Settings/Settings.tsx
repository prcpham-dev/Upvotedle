import React, { useEffect, useState } from 'react';
import {
  DEFAULT_MAX_UPVOTES,
  DEFAULT_MIN_UPVOTES,
  MAX_UPVOTES_LIMIT,
} from '../../../shared/lib/reddit/constants';
import {
  clampMaxUpvotes,
  clampMinUpvotes,
} from '../../../shared/lib/reddit/parseMaxUpvotes';
import type { UpvoteLimits } from '../../../shared/lib/settings';
import styles from './Settings.module.css';


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

  const parsedMin = Number.parseInt(minDraft, 10);
  const parsedMax = Number.parseInt(maxDraft, 10);
  const minVal = Number.isFinite(parsedMin) ? parsedMin : 0;
  const maxVal = Number.isFinite(parsedMax) ? parsedMax : MAX_UPVOTES_LIMIT;

  const isRangeInvalid = minVal > maxVal;

  const handleSave = () => {
    if (isRangeInvalid) return;

    const minUpvotes = clampMinUpvotes(minVal);
    const maxUpvotes = clampMaxUpvotes(maxVal);

    onSave({ minUpvotes, maxUpvotes });
    onClose();
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleIncrement = (field: 'min' | 'max', step = 1) => {
    if (field === 'min') {
      const currentVal = Number.parseInt(minDraft, 10);
      const val = clampMinUpvotes((Number.isFinite(currentVal) ? currentVal : 0) + step);
      setMinDraft(String(val));
    } else {
      const currentVal = Number.parseInt(maxDraft, 10);
      const val = clampMaxUpvotes((Number.isFinite(currentVal) ? currentVal : DEFAULT_MAX_UPVOTES) + step);
      setMaxDraft(String(val));
    }
  };

  const handleDecrement = (field: 'min' | 'max', step = 1) => {
    if (field === 'min') {
      const currentVal = Number.parseInt(minDraft, 10);
      const val = clampMinUpvotes((Number.isFinite(currentVal) ? currentVal : 0) - step);
      setMinDraft(String(val));
    } else {
      const currentVal = Number.parseInt(maxDraft, 10);
      const val = clampMaxUpvotes((Number.isFinite(currentVal) ? currentVal : DEFAULT_MAX_UPVOTES) - step);
      setMaxDraft(String(val));
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </button>
        </div>

        <p className={styles.description}>
          Control which posts can appear based on upvote count. Set a minimum to
          exclude low-vote posts, and a maximum to exclude viral posts.
        </p>

        <label className={styles.label} htmlFor="min-upvotes">
          Minimum upvotes per post
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="min-upvotes"
            type="number"
            min={0}
            max={MAX_UPVOTES_LIMIT}
            step={1}
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value)}
            className={`${styles.input} ${isRangeInvalid ? styles.inputError : ''}`}
          />
          <div className={styles.spinnerButtons}>
            <button
              type="button"
              className={styles.spinnerButton}
              onClick={() => handleIncrement('min', 1)}
              aria-label="Increment minimum upvotes"
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              className={styles.spinnerButton}
              onClick={() => handleDecrement('min', 1)}
              aria-label="Decrement minimum upvotes"
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <p className={styles.hint}>
          Default: {DEFAULT_MIN_UPVOTES.toLocaleString()}. Posts below this are
          excluded (e.g. 1000 hides posts with 500 upvotes).
        </p>

        <label className={styles.label} htmlFor="max-upvotes">
          Maximum upvotes per post
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="max-upvotes"
            type="number"
            min={1}
            max={MAX_UPVOTES_LIMIT}
            step={1}
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
            className={`${styles.input} ${isRangeInvalid ? styles.inputError : ''}`}
          />
          <div className={styles.spinnerButtons}>
            <button
              type="button"
              className={styles.spinnerButton}
              onClick={() => handleIncrement('max', 1)}
              aria-label="Increment maximum upvotes"
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              className={styles.spinnerButton}
              onClick={() => handleDecrement('max', 1)}
              aria-label="Decrement maximum upvotes"
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <p className={styles.hint}>
          Default: No limit. Set to {MAX_UPVOTES_LIMIT.toLocaleString()} or lower
          to exclude viral posts (e.g. 1000 hides posts with 5,000 upvotes).
        </p>

        {isRangeInvalid && (
          <div className={styles.errorMessage}>
            Minimum upvotes cannot be greater than maximum upvotes.
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isRangeInvalid}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
