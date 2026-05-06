/**
 * Token-based cost calculation for Vertex AI usage.
 *
 * Pricing (Gemini 2.5 Flash):
 *   Input:  $0.30 per 1M tokens
 *   Output: $2.50 per 1M tokens
 *
 * Credit system:
 *   1 credit = $0.001 (0.1 cent)
 *   Budget per cycle: $3.99 → 3,990 credits
 */
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}
/**
 * Calculate credit cost from actual token usage.
 * Returns minimum 1 credit for any completed request.
 */
export declare function calculateTokenCost(usage: TokenUsage): number;
/** Credits granted per subscription cycle ($3.99 budget) */
export declare const CREDITS_PER_CYCLE = 3990;
//# sourceMappingURL=token-cost.d.ts.map