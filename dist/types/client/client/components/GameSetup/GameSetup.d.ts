import React from 'react';
import type { UpvoteLimits } from '../../../shared/lib/settings';
import type { CustomConfig } from '../../../shared/types/types';
interface GameSetupProps {
    upvoteLimits: UpvoteLimits;
    customConfig: CustomConfig;
    onConfigChange: (newConfig: Partial<CustomConfig>) => void;
    onStartDaily: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onStartCustom: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onUpvoteLimitsChange: (limits: UpvoteLimits) => void;
    error?: string;
}
export default function GameSetup({ upvoteLimits, customConfig, onConfigChange, onStartDaily, onStartCustom, onUpvoteLimitsChange, error, }: GameSetupProps): import("react/jsx-runtime").JSX.Element;
export {};
