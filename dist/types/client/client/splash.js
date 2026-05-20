import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './index.css';
import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { requestExpandedMode } from '@devvit/web/client';
import GameSetup from './components/GameSetup/GameSetup';
import { DEFAULT_MAX_UPVOTES, DEFAULT_MIN_UPVOTES } from '../shared/lib/reddit/constants';
import { loadUpvoteLimits, saveUpvoteLimits } from '../shared/lib/settings';
const DEFAULT_LIMITS = {
    minUpvotes: DEFAULT_MIN_UPVOTES,
    maxUpvotes: DEFAULT_MAX_UPVOTES,
};
export const Splash = () => {
    const [upvoteLimits, setUpvoteLimits] = useState(DEFAULT_LIMITS);
    const [customConfig, setCustomConfig] = useState({
        subreddit: '',
        seed: '',
        isEndless: false,
    });
    // Restore inputs from localStorage on mount
    useEffect(() => {
        setUpvoteLimits(loadUpvoteLimits());
        setCustomConfig({
            subreddit: localStorage.getItem('redditdle_custom_subreddit') ?? '',
            seed: localStorage.getItem('redditdle_custom_seed') ?? '',
            isEndless: false,
        });
    }, []);
    const handleConfigChange = (newConfig) => {
        setCustomConfig((prev) => {
            if (newConfig.subreddit !== undefined)
                localStorage.setItem('redditdle_custom_subreddit', newConfig.subreddit);
            if (newConfig.seed !== undefined)
                localStorage.setItem('redditdle_custom_seed', newConfig.seed);
            return { ...prev, ...newConfig };
        });
    };
    const handleUpvoteLimitsChange = useCallback((limits) => {
        setUpvoteLimits(limits);
        saveUpvoteLimits(limits);
    }, []);
    const handleStartDaily = (e) => {
        localStorage.setItem('redditdle_start_game', 'true');
        localStorage.setItem('redditdle_game_mode', 'daily');
        // Request expanded view to start playing
        requestExpandedMode(e.nativeEvent, 'game');
    };
    const handleStartCustom = (e) => {
        localStorage.setItem('redditdle_start_game', 'true');
        localStorage.setItem('redditdle_game_mode', 'custom');
        localStorage.setItem('redditdle_custom_endless', customConfig.isEndless ? 'true' : 'false');
        // Request expanded view to start playing
        requestExpandedMode(e.nativeEvent, 'game');
    };
    return (_jsxs("div", { className: "flex relative flex-col justify-center items-center min-h-screen p-4 setup-bg", children: [_jsx(GameSetup, { upvoteLimits: upvoteLimits, customConfig: customConfig, onConfigChange: handleConfigChange, onStartDaily: handleStartDaily, onStartCustom: handleStartCustom, onUpvoteLimitsChange: handleUpvoteLimitsChange }), _jsx("p", { className: "text-xs text-gray-500 mt-4", children: "Percy Pham \u2022 Minh Pham \u2022 Danny Pham" })] }));
};
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(Splash, {}) }));
//# sourceMappingURL=splash.js.map