import { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    userId: string;
    userEmail: string;
    userName: string;
    userPicture: string;
}
/**
 * Middleware: verify Supabase Access Token and attach user info to request.
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map