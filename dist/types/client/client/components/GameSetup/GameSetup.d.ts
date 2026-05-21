import React from 'react';
import type { CustomConfig } from '../../../shared/types/types';
interface GameSetupProps {
    customConfig: CustomConfig;
    onConfigChange: (newConfig: Partial<CustomConfig>) => void;
    onStartDaily: (e: React.MouseEvent<HTMLButtonElement>) => void;
    onStartCustom: (e: React.MouseEvent<HTMLButtonElement>) => void;
    error?: string;
}
export default function GameSetup({ customConfig, onConfigChange, onStartDaily, onStartCustom, error, }: GameSetupProps): import("react/jsx-runtime").JSX.Element;
export {};
