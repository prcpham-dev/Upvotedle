"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./PostCard.module.css";
import { Post } from "../../types/types";

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  showUpvotes: boolean;
  status?: "winner" | "loser" | "none";
}

const formatUpvotes = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

// Ease-out exponential for a satisfying deceleration
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function useCountUp(target: number, active: boolean, duration = 1500) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setDisplay(0);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setDisplay(Math.floor(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, active, duration]);

  return display;
}

export default function PostCard({ post, onClick, showUpvotes, status = "none" }: PostCardProps) {

  const animatedUpvotes = useCountUp(post.upvotes, showUpvotes);

  const cardClasses = [
    styles.card,
  ].filter(Boolean).join(" ");

  const upvoteRowClass = [
    styles.upvoteRow,
    showUpvotes && status === "winner" && styles.winner,
    showUpvotes && status === "loser" && styles.loser,
  ].filter(Boolean).join(" ");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.titleArea}>
        {post.image && (
          <img
            src={post.image}
            alt=""
            className={styles.postImage}
            loading="lazy"
            decoding="async"
          />
        )}
        <h2 className={styles.title}>{post.title}</h2>
      </div>

      <div className={styles.upvotesContainer}>
        <p className={styles.upvoteLabel}>Upvotes</p>
        {showUpvotes ? (
          <div className={upvoteRowClass}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.upvoteArrow}>
              <path d="M12 4L4 14h5v6h6v-6h5L12 4z"/>
            </svg>
            <span className={styles.upvoteCount}>{formatUpvotes(animatedUpvotes)}</span>
          </div>
        ) : (
          <span className={styles.hiddenCount}>???</span>
        )}
      </div>
    </div>
  );
}