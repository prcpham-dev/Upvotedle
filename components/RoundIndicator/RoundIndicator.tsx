"use client";

import React from "react";
import styles from "./RoundIndicator.module.css";

export type RoundStatus = "unplayed" | "correct" | "wrong";

interface RoundIndicatorProps {
  rounds: RoundStatus[];
}

export default function RoundIndicator({ rounds }: RoundIndicatorProps) {
  return (
    <div className={styles.container}>
      <ul className={styles.indicatorList}>
        {rounds.map((status, index) => (
          <li
            key={index}
            className={`${styles.circle} ${styles[status]}`}
            aria-label={`Round ${index + 1}: ${status}`}
          />
        ))}
      </ul>
    </div>
  );
}
