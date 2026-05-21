import React, { useState, useEffect, useRef } from 'react';
import styles from './PostCard.module.css';
import type { Post } from '../../types/types';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
  showUpvotes: boolean;
  status?: 'winner' | 'loser' | 'none';
}

const formatUpvotes = (num: number) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
};

function relativeTime(createdAt: number): string {
  if (!createdAt) return '';
  const seconds = Math.floor(Date.now() / 1000 - createdAt);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

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
      setDisplay(Math.floor(easeOutExpo(progress) * target));
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

export default function PostCard({ post, onClick, showUpvotes, status = 'none' }: PostCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (post.image) setIsImageLoading(true);
  }, [post.image]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!redditLink) return;

    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(redditLink);
        success = true;
      }
    } catch (err) {
      console.warn('Clipboard API failed, using fallback', err);
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = redditLink;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const animatedUpvotes = useCountUp(post.upvotes, showUpvotes);

  const cardClasses = [styles.card, post.image && styles.hasImage]
    .filter(Boolean)
    .join(' ');

  const upvoteRowClass = [
    styles.upvoteRow,
    showUpvotes && status === 'winner' && styles.winner,
    showUpvotes && status === 'loser' && styles.loser,
  ]
    .filter(Boolean)
    .join(' ');

  const postMetaClass = [
    styles.postMeta,
    showUpvotes && status === 'loser' && styles.postMetaLoser,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const redditLink = post.permalink
    ? `https://np.reddit.com${post.permalink}`
    : null;

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.titleArea}>
        {post.image && (
          <div className={styles.imageContainer}>
            {isImageLoading && <div className={styles.skeleton} />}
            <img
              src={post.image}
              alt=""
              className={`${styles.postImage} ${isImageLoading ? styles.hiddenImage : ''}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setIsImageLoading(false)}
              onError={() => setIsImageLoading(false)}
            />
          </div>
        )}
        <h2 className={styles.title}>{post.title}</h2>
      </div>

      <div className={styles.upvotesContainer}>
        {showUpvotes ? (
          <>
            <div className={upvoteRowClass}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.upvoteArrow}>
                <path d="M12 4L4 14h5v6h6v-6h5L12 4z" />
              </svg>
              <span className={styles.upvoteCount}>{formatUpvotes(animatedUpvotes)}</span>
            </div>

            <div className={postMetaClass}>
              {post.author && (
                <span className={styles.metaAuthor}>u/{post.author}</span>
              )}
              {post.createdAt > 0 && (
                <span className={styles.metaDate}>{relativeTime(post.createdAt)}</span>
              )}
              {redditLink && (
                <button
                  type="button"
                  className={`${styles.metaLink} ${copied ? styles.copied : ''}`}
                  onClick={handleCopyLink}
                >
                  {copied ? 'Copied! ✓' : 'Copy Link 📋'}
                </button>
              )}
            </div>
          </>
        ) : (
          <span className={styles.hiddenCount}>???</span>
        )}
      </div>
    </div>
  );
}
