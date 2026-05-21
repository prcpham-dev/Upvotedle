import type { UpvoteLimits } from '../../../shared/lib/settings';
interface SettingsProps {
    isOpen: boolean;
    upvoteLimits: UpvoteLimits;
    onClose: () => void;
    onSave: (limits: UpvoteLimits) => void;
}
export default function Settings({ isOpen, upvoteLimits, onClose, onSave, }: SettingsProps): import("react/jsx-runtime").JSX.Element | null;
export {};
