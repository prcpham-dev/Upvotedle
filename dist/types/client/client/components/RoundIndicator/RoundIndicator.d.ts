export type RoundStatus = 'unplayed' | 'correct' | 'wrong';
interface RoundIndicatorProps {
    rounds: RoundStatus[];
}
export default function RoundIndicator({ rounds }: RoundIndicatorProps): import("react/jsx-runtime").JSX.Element;
export {};
