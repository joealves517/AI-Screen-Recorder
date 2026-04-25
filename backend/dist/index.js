import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/index.js";
import { rateLimit } from "./middleware/rate-limit.js";
import userRouter from "./routes/user.js";
import webhookRouter from "./routes/webhook.js";
import screenityAiRouter from "./routes/screenity-ai.js";
import screenityAiFreeRouter from "./routes/screenity-ai-free.js";
const app = express();
// ─── Security ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: [
        // BlackNote Chrome extension (Web Store)
        "chrome-extension://cgmimbllhpkfcegecbdhldfmlfbfdhfg",
        // BlackNote Chrome extension (development)
        "chrome-extension://kifnbpilpjgdkjbpcejligaglcjdkjjb",
        // Screenity Chrome extension (allow all origins during dev)
        /^chrome-extension:\/\/.+$/,
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
// ─── Body Parsing ───────────────────────────────────────────────────
// Webhook route needs raw body for signature verification
app.use("/api/webhook/ls", express.raw({ type: "application/json" }), webhookRouter);
// All other routes use JSON parsing
// Screenity transcription sends base64 audio, needs larger limit
app.use("/api/screenity", express.json({ limit: "50mb" }));
app.use(express.json({ limit: "2mb" }));
// ─── Rate Limiting ──────────────────────────────────────────────────
app.use("/api/screenity", rateLimit);
// ─── Routes ─────────────────────────────────────────────────────────
app.use("/api/screenity/free", screenityAiFreeRouter);
app.use("/api/screenity", screenityAiRouter);
app.use("/api/user", userRouter);
// ─── Health Check ───────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", app: "screenity-api", version: "2.0.0" });
});
// ─── 404 ────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
});
// ─── Start ──────────────────────────────────────────────────────────
app.listen(config.port, () => {
    console.log(`[Screenity API] Listening on port ${config.port}`);
    console.log(`[Screenity API] Environment: ${config.nodeEnv}`);
    console.log(`[Screenity API] GCP Project: ${config.gcp.projectId}`);
});
export default app;
//# sourceMappingURL=index.js.map