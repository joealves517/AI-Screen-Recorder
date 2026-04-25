import { Firestore } from "@google-cloud/firestore";
declare const db: Firestore;
export interface UserDocument {
    email: string;
    displayName: string;
    picture: string;
    credits: number;
    totalCreditsUsed: number;
    tier: "free" | "premium";
    lemonSqueezy: {
        customerId: string | null;
        subscriptionId: string | null;
        subscriptionItemId: string | null;
        status: string | null;
        currentPeriodEnd: Date | null;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface UsageLog {
    userId: string;
    app: string;
    creditsUsed: number;
    model: string;
    timestamp: Date;
}
export declare function getUserByEmail(email: string): Promise<{
    id: string;
    data: UserDocument;
} | null>;
export declare function createOrUpdateUser(userId: string, profile: {
    email: string;
    displayName: string;
    picture: string;
}): Promise<UserDocument & {
    id: string;
}>;
/**
 * Deduct credits atomically. Returns false if insufficient balance.
 */
export declare function deductCreditsByEmail(email: string, amount: number): Promise<boolean>;
/**
 * Add credits to a user's balance (e.g., after purchase).
 */
export declare function addCreditsByEmail(email: string, amount: number): Promise<void>;
/**
 * Update Lemon Squeezy subscription info on a user document.
 */
export declare function updateSubscriptionByEmail(email: string, data: Partial<UserDocument["lemonSqueezy"]> & {
    tier?: UserDocument["tier"];
}): Promise<void>;
/**
 * Find a user by their Lemon Squeezy customer ID.
 */
export declare function findUserByLemonSqueezyCustomerId(customerId: string): Promise<{
    id: string;
    data: UserDocument;
} | null>;
export declare function logUsage(log: UsageLog): Promise<void>;
export { db };
//# sourceMappingURL=firestore.d.ts.map