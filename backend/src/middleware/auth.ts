import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
  userName: string;
  userPicture: string;
}

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xloruyavtuvcoqrvjolp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsb3J1eWF2dHV2Y29xcnZqb2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjA5OTUsImV4cCI6MjA5MjUzNjk5NX0.ssnDrw4mldgIoDfFa4SpUIMNzcenv_hrctePwtOcSEA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface GoogleTokenInfo {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  email_verified: string;
  aud: string;
}

async function verifyGoogleToken(token: string): Promise<GoogleTokenInfo | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
    if (!res.ok) return null;

    const info = (await res.json()) as GoogleTokenInfo;
    if (info.email && info.email_verified === "true") {
      return info;
    }
    return null;
  } catch {
    return null;
  }
}

async function getGoogleUserInfo(token: string): Promise<{ email: string; name: string; picture: string; sub: string } | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return await res.json() as any;
  } catch {
    return null;
  }
}

/**
 * Middleware: verify Google Access Token or Supabase Access Token.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing_token" });
    return;
  }

  const token = authHeader.slice(7);

  // Strategy 1: Google OAuth Token
  const googleInfo = await verifyGoogleToken(token);
  if (googleInfo) {
    const userInfo = await getGoogleUserInfo(token);
    
    const authReq = req as AuthenticatedRequest;
    authReq.userId = googleInfo.sub;
    authReq.userEmail = googleInfo.email;
    authReq.userName = userInfo?.name || googleInfo.email.split("@")[0];
    authReq.userPicture = userInfo?.picture || "";
    return next();
  }

  // Strategy 2: Fallback to Supabase JWT (legacy extensions)
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error(error?.message || "Invalid token");
    }

    // Attach user info to request
    const authReq = req as AuthenticatedRequest;
    authReq.userId = user.id;
    authReq.userEmail = user.email || "";
    authReq.userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
    authReq.userPicture = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

    return next();
  } catch (error) {
    console.error("[Auth] Both Google and Supabase token verification failed:", error);
    res.status(401).json({ error: "invalid_token" });
  }
}
