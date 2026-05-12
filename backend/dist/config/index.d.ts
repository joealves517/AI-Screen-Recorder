declare function loadEnv(): {
    readonly port: number;
    readonly nodeEnv: string;
    readonly gcp: {
        readonly projectId: string;
        readonly region: string;
    };
    readonly gemini: {
        readonly apiKey: string;
    };
    readonly google: {
        readonly oauthClientId: string;
    };
    readonly lemonSqueezy: {
        readonly apiKey: string;
        readonly webhookSecret: string;
        readonly storeId: string;
    };
    readonly groq: {
        readonly apiKey: string;
    };
};
export declare const config: {
    readonly port: number;
    readonly nodeEnv: string;
    readonly gcp: {
        readonly projectId: string;
        readonly region: string;
    };
    readonly gemini: {
        readonly apiKey: string;
    };
    readonly google: {
        readonly oauthClientId: string;
    };
    readonly lemonSqueezy: {
        readonly apiKey: string;
        readonly webhookSecret: string;
        readonly storeId: string;
    };
    readonly groq: {
        readonly apiKey: string;
    };
};
export type AppConfig = ReturnType<typeof loadEnv>;
export {};
//# sourceMappingURL=index.d.ts.map