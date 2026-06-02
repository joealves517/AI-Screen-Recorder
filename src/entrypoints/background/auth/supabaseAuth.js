/**
 * Google OAuth for Chrome Extension — replaces Supabase auth.
 * Retains function names for backward compatibility with existing imports.
 * Uses chrome.identity.getAuthToken() to get Google session token,
 * then stores it in chrome.storage.local for backend API calls.
 */

const API_BASE = process.env.AISR_API_BASE_URL;

/**
 * Initiate Google OAuth via chrome.identity.getAuthToken.
 * Returns the access token and user profile on success.
 */
export async function supabaseGoogleLogin() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error("[Auth] Google OAuth error:", chrome.runtime.lastError?.message);
        reject(new Error(chrome.runtime.lastError?.message || "Failed to get token"));
        return;
      }

      try {
        // Fetch user profile from Google
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!userInfoRes.ok) {
          throw new Error(`Google user fetch failed: ${userInfoRes.status}`);
        }

        const profile = await userInfoRes.json();

        const user = {
          id: profile.sub,
          email: profile.email,
          name: profile.name || profile.email?.split("@")[0] || "",
          avatar: profile.picture || "",
        };

        // Store auth state in chrome.storage.local
        // Using same keys for backward compatibility
        await chrome.storage.local.set({
          aisrToken: token,
          aisrRefreshToken: "managed-by-chrome", // Chrome manages refresh automatically
          aisrUser: user,
          isLoggedIn: true,
          wasLoggedIn: false,
          stayLoggedOut: false,
          lastAuthCheck: Date.now(),
        });

        // Fetch user profile from our backend (creates user in Firestore if needed)
        if (API_BASE) {
          try {
            const backendRes = await fetch(`${API_BASE}/api/user`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (backendRes.ok) {
              const backendUser = await backendRes.json();
              const quotaExhausted = backendUser.tier === "premium" && (backendUser.credits !== undefined && Number(backendUser.credits) <= 0);
              await chrome.storage.local.set({
                isSubscribed: backendUser.tier === "premium",
                proSubscription: backendUser.subscription || null,
                quotaExhausted: quotaExhausted,
              });
            }
          } catch (backendErr) {
            console.warn("[Auth] Backend user fetch failed (non-critical):", backendErr.message);
          }
        }

        resolve({ success: true, user, accessToken: token });
      } catch (err) {
        console.error("[Auth] Failed to process OAuth response:", err);
        // Clean up token on error
        chrome.identity.removeCachedAuthToken({ token }, () => {});
        reject(err);
      }
    });
  });
}

/**
 * Refresh the access token. 
 * Since chrome.identity handles refresh automatically, we just get the token again.
 */
export async function refreshSupabaseToken() {
  const { aisrToken } = await chrome.storage.local.get(["aisrToken"]);

  if (!aisrToken) {
    return null;
  }

  try {
    // Remove the cached token to force Chrome to fetch a new one if it expired
    await new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token: aisrToken }, resolve);
    });

    const newToken = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError || !token) {
          reject(new Error(chrome.runtime.lastError?.message || "Failed to refresh token"));
        } else {
          resolve(token);
        }
      });
    });

    await chrome.storage.local.set({
      aisrToken: newToken,
      lastAuthCheck: Date.now(),
    });

    return newToken;
  } catch (err) {
    console.error("[Auth] Token refresh failed:", err.message);
    // Clear auth state on refresh failure
    await chrome.storage.local.set({
      isLoggedIn: false,
      aisrToken: null,
      aisrRefreshToken: null,
      aisrUser: null,
    });
    return null;
  }
}
