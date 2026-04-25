/**
 * Verify a Lemon Squeezy webhook signature (HMAC SHA-256).
 */
export declare function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean;
/**
 * Report usage to Lemon Squeezy (increment action for sum aggregation).
 */
export declare function reportUsage(subscriptionItemId: string, quantity: number): Promise<void>;
export interface LSWebhookPayload {
    meta: {
        event_name: string;
        custom_data?: {
            user_id?: string;
        };
    };
    data: {
        id: string;
        type: string;
        attributes: Record<string, unknown>;
        relationships?: Record<string, unknown>;
    };
}
//# sourceMappingURL=lemonsqueezy.d.ts.map