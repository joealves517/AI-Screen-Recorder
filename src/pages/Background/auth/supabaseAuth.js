/**
 * Supabase OAuth for Chrome Extension — direct Google login without web app.
 * Uses chrome.identity.launchWebAuthFlow to get Supabase session token,
 * then stores it in chrome.storage.local for backend API calls.
 */

const SUPABASE_URL = "https://xloruyavtuvcoqrvjolp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsb3J1eWF2dHV2Y29xcnZqb2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjA5OTUsImV4cCI6MjA5MjUzNjk5NX0.ssnDrw4mldgIoDfFa4SpUIMNzcenv_hrctePwtOcSEA";

const API_BASE = process.env.SCREENITY_API_BASE_URL;

/**
 * Initiate Supabase Google OAuth via chrome.identity.launchWebAuthFlow.
 * Returns the Supabase access token on success.
 */
export async function supabaseGoogleLogin() {
  const redirectUrl = chrome.identity.getRedirectURL();

  // Build the Supabase OAuth URL for Google provider
  const authUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authUrl.searchParams.set("provider", "google");
  authUrl.searchParams.set("redirect_to", redirectUrl);

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.href,
        interactive: true,
      },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.error("[Auth] Supabase OAuth error:", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!responseUrl) {
          reject(new Error("User cancelled sign-in"));
          return;
        }

        try {
          // Supabase returns tokens in the URL hash fragment
          const hashParams = new URLSearchParams(
            new URL(responseUrl).hash.substring(1)
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (!accessToken) {
            reject(new Error("No access_token in Supabase response"));
            return;
          }

          // Fetch user profile from Supabase
          const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: SUPABASE_ANON_KEY,
            },
          });

          if (!userResponse.ok) {
            throw new Error(`Supabase user fetch failed: ${userResponse.status}`);
          }

          const supabaseUser = await userResponse.json();

          const user = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name:
              supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              supabaseUser.email?.split("@")[0] || "",
            avatar:
              supabaseUser.user_metadata?.avatar_url ||
              supabaseUser.user_metadata?.picture || "",
          };

          // Store auth state in chrome.storage.local
          await chrome.storage.local.set({
            screenityToken: accessToken,
            screenityRefreshToken: refreshToken,
            screenityUser: user,
            isLoggedIn: true,
            wasLoggedIn: false,
            stayLoggedOut: false,
            lastAuthCheck: Date.now(),
          });

          // Fetch user profile from our backend (creates user in Firestore if needed)
          if (API_BASE) {
            try {
              const backendRes = await fetch(`${API_BASE}/api/user`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (backendRes.ok) {
                const backendUser = await backendRes.json();
                await chrome.storage.local.set({
                  isSubscribed: backendUser.tier === "premium",
                  proSubscription: backendUser.subscription || null,
                });
              }
            } catch (backendErr) {
              console.warn("[Auth] Backend user fetch failed (non-critical):", backendErr.message);
            }
          }

          resolve({ success: true, user, accessToken });
        } catch (err) {
          console.error("[Auth] Failed to process OAuth response:", err);
          reject(err);
        }
      }
    );
  });
}

/**
 * Refresh the Supabase access token using the stored refresh token.
 */
export async function refreshSupabaseToken() {
  const { screenityRefreshToken } = await chrome.storage.local.get(["screenityRefreshToken"]);

  if (!screenityRefreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: screenityRefreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const data = await response.json();

    await chrome.storage.local.set({
      screenityToken: data.access_token,
      screenityRefreshToken: data.refresh_token,
      lastAuthCheck: Date.now(),
    });

    return data.access_token;
  } catch (err) {
    console.error("[Auth] Token refresh failed:", err.message);
    // Clear auth state on refresh failure
    await chrome.storage.local.set({
      isLoggedIn: false,
      screenityToken: null,
      screenityRefreshToken: null,
      screenityUser: null,
    });
    return null;
  }
}
