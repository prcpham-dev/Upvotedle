import { jsx as _jsx } from "react/jsx-runtime";
import styles from './RoundIndicator.module.css';
export default function RoundIndicator({ rounds }) {
    return (_jsx("div", { className: styles.container, children: _jsx("ul", { className: styles.indicatorList, children: rounds.map((status, index) => (_jsx("li", { className: `${styles.circle} ${styles[status]}`, "aria-label": `Round ${index + 1}: ${status}` }, index))) }) }));
}
//# sourceMappingURL=RoundIndicator.js.map