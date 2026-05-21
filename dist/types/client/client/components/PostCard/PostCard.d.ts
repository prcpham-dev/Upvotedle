import type { Post } from '../../types/types';
interface PostCardProps {
    post: Post;
    onClick?: () => void;
    showUpvotes: boolean;
    status?: 'winner' | 'loser' | 'none';
}
export default function PostCard({ post, onClick, showUpvotes, status }: PostCardProps): import("react/jsx-runtime").JSX.Element;
export {};
