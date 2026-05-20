import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import styles from './PostCard.module.css';
const formatUpvotes = (num) => {
    if (num >= 1_000_000)
        return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000)
        return (num / 1_000).toFixed(1) + 'k';
    return num.toString();
};
function relativeTime(createdAt) {
    if (!createdAt)
        return '';
    const seconds = Math.floor(Date.now() / 1000 - createdAt);
    if (seconds < 60)
        return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30)
        return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12)
        return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}
function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
function useCountUp(target, active, duration = 1500) {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);
    useEffect(() => {
        if (!active) {
            setDisplay(0);
            return;
        }
        const start = performance.now();
        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            setDisplay(Math.floor(easeOutExpo(progress) * target));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
            else {
                setDisplay(target);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current)
                cancelAnimationFrame(rafRef.current);
        };
    }, [target, active, duration]);
    return display;
}
export default function PostCard({ post, onClick, showUpvotes, status = 'none' }) {
    const [isImageLoading, setIsImageLoading] = useState(true);
    useEffect(() => {
        if (post.image)
            setIsImageLoading(true);
    }, [post.image]);
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
    const handleKeyDown = (e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    };
    const redditLink = post.permalink
        ? `https://np.reddit.com${post.permalink}`
        : null;
    return (_jsxs("div", { className: cardClasses, onClick: onClick, onKeyDown: handleKeyDown, role: onClick ? 'button' : undefined, tabIndex: onClick ? 0 : undefined, children: [_jsxs("div", { className: styles.titleArea, children: [post.image && (_jsxs("div", { className: styles.imageContainer, children: [isImageLoading && _jsx("div", { className: styles.skeleton }), _jsx("img", { src: post.image, alt: "", className: `${styles.postImage} ${isImageLoading ? styles.hiddenImage : ''}`, loading: "lazy", decoding: "async", onLoad: () => setIsImageLoading(false), onError: () => setIsImageLoading(false) })] })), _jsx("h2", { className: styles.title, children: post.title })] }), _jsxs("div", { className: styles.upvotesContainer, children: [_jsx("p", { className: styles.upvoteLabel, children: "Upvotes" }), showUpvotes ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: upvoteRowClass, children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", className: styles.upvoteArrow, children: _jsx("path", { d: "M12 4L4 14h5v6h6v-6h5L12 4z" }) }), _jsx("span", { className: styles.upvoteCount, children: formatUpvotes(animatedUpvotes) })] }), _jsxs("div", { className: postMetaClass, children: [post.author && (_jsxs("span", { className: styles.metaAuthor, children: ["u/", post.author] })), post.createdAt > 0 && (_jsx("span", { className: styles.metaDate, children: relativeTime(post.createdAt) })), redditLink && (_jsx("a", { href: redditLink, target: "_blank", rel: "noopener noreferrer", className: styles.metaLink, onClick: (e) => e.stopPropagation(), children: "View on Reddit \u2197" }))] })] })) : (_jsx("span", { className: styles.hiddenCount, children: "???" }))] })] }));
}
//# sourceMappingURL=PostCard.js.map