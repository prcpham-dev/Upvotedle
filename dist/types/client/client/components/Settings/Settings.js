import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { DEFAULT_MAX_UPVOTES, DEFAULT_MIN_UPVOTES, MAX_UPVOTES_LIMIT, } from '../../../shared/lib/reddit/constants';
import { clampMaxUpvotes, clampMinUpvotes, } from '../../../shared/lib/reddit/parseMaxUpvotes';
import styles from './Settings.module.css';
export default function Settings({ isOpen, upvoteLimits, onClose, onSave, }) {
    const [minDraft, setMinDraft] = useState(String(upvoteLimits.minUpvotes));
    const [maxDraft, setMaxDraft] = useState(String(upvoteLimits.maxUpvotes));
    useEffect(() => {
        if (isOpen) {
            setMinDraft(String(upvoteLimits.minUpvotes));
            setMaxDraft(String(upvoteLimits.maxUpvotes));
        }
    }, [isOpen, upvoteLimits]);
    if (!isOpen) {
        return null;
    }
    const parsedMin = Number.parseInt(minDraft, 10);
    const parsedMax = Number.parseInt(maxDraft, 10);
    const minVal = Number.isFinite(parsedMin) ? parsedMin : 0;
    const maxVal = Number.isFinite(parsedMax) ? parsedMax : MAX_UPVOTES_LIMIT;
    const isRangeInvalid = minVal > maxVal;
    const handleSave = () => {
        if (isRangeInvalid)
            return;
        const minUpvotes = clampMinUpvotes(minVal);
        const maxUpvotes = clampMaxUpvotes(maxVal);
        onSave({ minUpvotes, maxUpvotes });
        onClose();
    };
    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };
    const handleIncrement = (field, step = 1) => {
        if (field === 'min') {
            const currentVal = Number.parseInt(minDraft, 10);
            const val = clampMinUpvotes((Number.isFinite(currentVal) ? currentVal : 0) + step);
            setMinDraft(String(val));
        }
        else {
            const currentVal = Number.parseInt(maxDraft, 10);
            const val = clampMaxUpvotes((Number.isFinite(currentVal) ? currentVal : DEFAULT_MAX_UPVOTES) + step);
            setMaxDraft(String(val));
        }
    };
    const handleDecrement = (field, step = 1) => {
        if (field === 'min') {
            const currentVal = Number.parseInt(minDraft, 10);
            const val = clampMinUpvotes((Number.isFinite(currentVal) ? currentVal : 0) - step);
            setMinDraft(String(val));
        }
        else {
            const currentVal = Number.parseInt(maxDraft, 10);
            const val = clampMaxUpvotes((Number.isFinite(currentVal) ? currentVal : DEFAULT_MAX_UPVOTES) - step);
            setMaxDraft(String(val));
        }
    };
    return (_jsx("div", { className: styles.overlay, role: "dialog", "aria-modal": "true", "aria-labelledby": "settings-title", onClick: handleOverlayClick, children: _jsxs("div", { className: styles.panel, children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { id: "settings-title", className: styles.title, children: "Settings" }), _jsx("button", { type: "button", className: styles.closeButton, onClick: onClose, "aria-label": "Close settings", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", x2: "6", y1: "6", y2: "18" }), _jsx("line", { x1: "6", x2: "18", y1: "6", y2: "18" })] }) })] }), _jsx("p", { className: styles.description, children: "Control which posts can appear based on upvote count. Set a minimum to exclude low-vote posts, and a maximum to exclude viral posts." }), _jsx("label", { className: styles.label, htmlFor: "min-upvotes", children: "Minimum upvotes per post" }), _jsxs("div", { className: styles.inputWrapper, children: [_jsx("input", { id: "min-upvotes", type: "number", min: 0, max: MAX_UPVOTES_LIMIT, step: 1, value: minDraft, onChange: (e) => setMinDraft(e.target.value), className: `${styles.input} ${isRangeInvalid ? styles.inputError : ''}` }), _jsxs("div", { className: styles.spinnerButtons, children: [_jsx("button", { type: "button", className: styles.spinnerButton, onClick: () => handleIncrement('min', 1), "aria-label": "Increment minimum upvotes", children: _jsx("svg", { width: "10", height: "6", viewBox: "0 0 10 6", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 5L5 1L9 5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("button", { type: "button", className: styles.spinnerButton, onClick: () => handleDecrement('min', 1), "aria-label": "Decrement minimum upvotes", children: _jsx("svg", { width: "10", height: "6", viewBox: "0 0 10 6", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 1L5 5L9 1", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })] }), _jsxs("p", { className: styles.hint, children: ["Default: ", DEFAULT_MIN_UPVOTES.toLocaleString(), ". Posts below this are excluded (e.g. 1000 hides posts with 500 upvotes)."] }), _jsx("label", { className: styles.label, htmlFor: "max-upvotes", children: "Maximum upvotes per post" }), _jsxs("div", { className: styles.inputWrapper, children: [_jsx("input", { id: "max-upvotes", type: "number", min: 1, max: MAX_UPVOTES_LIMIT, step: 1, value: maxDraft, onChange: (e) => setMaxDraft(e.target.value), className: `${styles.input} ${isRangeInvalid ? styles.inputError : ''}` }), _jsxs("div", { className: styles.spinnerButtons, children: [_jsx("button", { type: "button", className: styles.spinnerButton, onClick: () => handleIncrement('max', 1), "aria-label": "Increment maximum upvotes", children: _jsx("svg", { width: "10", height: "6", viewBox: "0 0 10 6", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 5L5 1L9 5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("button", { type: "button", className: styles.spinnerButton, onClick: () => handleDecrement('max', 1), "aria-label": "Decrement maximum upvotes", children: _jsx("svg", { width: "10", height: "6", viewBox: "0 0 10 6", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M1 1L5 5L9 1", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] })] }), _jsxs("p", { className: styles.hint, children: ["Default: No limit. Set to ", MAX_UPVOTES_LIMIT.toLocaleString(), " or lower to exclude viral posts (e.g. 1000 hides posts with 5,000 upvotes)."] }), isRangeInvalid && (_jsx("div", { className: styles.errorMessage, children: "Minimum upvotes cannot be greater than maximum upvotes." })), _jsxs("div", { className: styles.actions, children: [_jsx("button", { type: "button", className: styles.cancelButton, onClick: onClose, children: "Cancel" }), _jsx("button", { type: "button", className: styles.saveButton, onClick: handleSave, disabled: isRangeInvalid, children: "Save" })] })] }) }));
}
//# sourceMappingURL=Settings.js.map