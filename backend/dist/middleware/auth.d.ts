/**
 * Auth Middleware
 *
 * Only supports Google OAuth token (chrome.identity)
 * Supabase login is no longer supported.
 */
import { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    userId: string;
    userEmail: string;
    userName: string;
    userPicture: string;
}
/**
 * Authenticate requests using Google OAuth token.
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map