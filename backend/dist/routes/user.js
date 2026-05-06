import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createOrUpdateUser } from "../services/firestore.js";
const router = Router();
/**
 * GET /api/user
 * Returns user profile, tier, and credits balance.
 * Creates user document in Firestore if it doesn't exist yet.
 */
router.get("/", requireAuth, async (req, res) => {
    const authReq = req;
    const user = await createOrUpdateUser(authReq.userId, {
        email: authReq.userEmail,
        displayName: authReq.userName,
        picture: authReq.userPicture,
    }, "AI Screen Recorder");
    res.json({
        userId: authReq.userId,
        email: user.email,
        displayName: user.displayName,
        picture: user.picture,
        tier: user.tier,
        credits: user.credits,
        subscription: {
            status: user.lemonSqueezy.status,
            currentPeriodEnd: user.lemonSqueezy.currentPeriodEnd,
        },
    });
});
export default router;
//# sourceMappingURL=user.js.map