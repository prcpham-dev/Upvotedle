"use client";

import React from "react";
import styles from "./PostCard.module.css";
import { Post } from "../../types/types";
import { ArrowUp } from "lucide-react";

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  showUpvotes: boolean;
  status?: "winner" | "loser" | "none";
}

// Moved outside to prevent recreation on every re-render
const formatUpvotes = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

export default function PostCard({ post, onClick, showUpvotes, status = "none" }: PostCardProps) {

  // Clean array filtering to build class names without trailing/missing spaces
  const cardClasses = [
    styles.card,
    "flex flex-col items-center justify-center",
    showUpvotes && status === "winner" && styles.winner,
    showUpvotes && status === "loser" && styles.loser,
  ].filter(Boolean).join(" ");

  // Handle keyboard accessibility for screen readers/keyboard users
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
      <h2 className={styles.title}>{post.title}</h2>

      <div className={`${styles.upvotesContainer} flex flex-col items-center justify-center`}>
        <p className={styles.upvoteLabel}>Upvotes</p>
        {showUpvotes ? (
          <div className="flex flex-row items-center justify-center gap-2">
            <ArrowUp size={32} color="#ff4500" />
            <span className={styles.upvoteCount}>{formatUpvotes(post.upvotes)}</span>
          </div>
        ) : (
          <span className={styles.hiddenCount}>???</span>
        )}
      </div>
    </div>
  );
}