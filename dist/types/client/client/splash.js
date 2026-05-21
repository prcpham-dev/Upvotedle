import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './index.css';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { requestExpandedMode } from '@devvit/web/client';
import GameSetup from './components/GameSetup/GameSetup';
export const Splash = () => {
    const [customConfig, setCustomConfig] = useState({
        subreddit: '',
        seed: '',
        isEndless: false,
    });
    useEffect(() => {
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
    const handleStartDaily = (e) => {
        localStorage.setItem('redditdle_start_game', 'true');
        localStorage.setItem('redditdle_game_mode', 'daily');
        requestExpandedMode(e.nativeEvent, 'game');
    };
    const handleStartCustom = (e) => {
        localStorage.setItem('redditdle_start_game', 'true');
        localStorage.setItem('redditdle_game_mode', 'custom');
        localStorage.setItem('redditdle_custom_endless', customConfig.isEndless ? 'true' : 'false');
        requestExpandedMode(e.nativeEvent, 'game');
    };
    return (_jsxs("div", { className: "flex relative flex-col justify-center items-center min-h-screen p-4 setup-bg", children: [_jsx(GameSetup, { customConfig: customConfig, onConfigChange: handleConfigChange, onStartDaily: handleStartDaily, onStartCustom: handleStartCustom }), _jsx("p", { className: "text-xs text-gray-500 mt-4", children: "Percy Pham \u2022 Minh Pham \u2022 Danny Pham" })] }));
};
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(Splash, {}) }));
//# sourceMappingURL=splash.js.map