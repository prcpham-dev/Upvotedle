export declare function clampMaxUpvotes(value: number): number;
export declare function clampMinUpvotes(value: number): number;
/**
 * Parses `maxUpvotes` from a query string. Returns default when missing or invalid.
 */
export declare function parseMaxUpvotes(raw: string | null | undefined): number;
/**
 * Parses `minUpvotes` from a query string. Returns default when missing or invalid.
 */
export declare function parseMinUpvotes(raw: string | null | undefined): number;
/** Parses comma-separated post ids to exclude from selection. */
export declare function parseExcludePostIds(raw: string | null | undefined): Set<string>;
