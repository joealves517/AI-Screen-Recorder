import { getCurrentTab, sendMessageTab } from "../tabManagement";

const API_BASE = process.env.AISR_API_BASE_URL;
const CLOUD_FEATURES_ENABLED =
  process.env.AISR_ENABLE_CLOUD_FEATURES === "true";

export const loginWithWebsite = async () => {
  if (!CLOUD_FEATURES_ENABLED) {
    return { authenticated: false, instantMode: false };
  }

  // User explicitly chose to stay logged out — respect that until they
  // initiate a login themselves (handle-login clears this flag).
  const { stayLoggedOut } = await chrome.storage.local.get(["stayLoggedOut"]);
  if (stayLoggedOut) {
    return { authenticated: false, instantMode: false };
  }

  const { aisrToken, lastAuthCheck, instantMode } =
    await chrome.storage.local.get([
      "aisrToken",
      "lastAuthCheck",
      "instantMode",
    ]);

  if (!aisrToken) {
    await chrome.storage.local.set({ isLoggedIn: false });
    return { authenticated: false, instantMode: false };
  }

  const now = Date.now();
  const FRESH_FOR = 1000 * 60 * 60 * 4; // 4 hours
  let isTokenInvalid = false;

  if (lastAuthCheck && now - lastAuthCheck < FRESH_FOR) {
    const {
      aisrUser,
      isSubscribed,
      proSubscription,
      hasSubscribedBefore,
    } = await chrome.storage.local.get([
      "aisrUser",
      "isSubscribed",
      "proSubscription",
      "hasSubscribedBefore",
    ]);

    if (aisrUser) {
      // Single storage write to avoid multiple onChanged events
      await chrome.storage.local.set({
        onboarding: false,
        isLoggedIn: true,
        wasLoggedIn: false,
        ...(!instantMode
          ? {
              backgroundEffectsActive: false,
              backgroundEffect: "",
              fpsValue: "30",
            }
          : {}),
      });

      return {
        authenticated: true,
        user: aisrUser,
        subscribed: isSubscribed || false,
        proSubscription: proSubscription || null,
        hasSubscribedBefore: !!hasSubscribedBefore,
        cached: true,
        instantMode: instantMode || false,
      };
    }

    // Cache is marked fresh but user payload is missing; force a verify call.
    await chrome.storage.local.set({ lastAuthCheck: 0 });
  }

  try {
    const response = await fetch(`${API_BASE}/api/user`, {
      headers: {
        Authorization: `Bearer ${aisrToken}`,
      },
    });

    if (!response.ok) {
      isTokenInvalid = response.status === 401 || response.status === 403;
      throw new Error(`Token verify failed (${response.status})`);
    }

    const responseData = await response.json();

    // Map /api/user response to expected shape
    const user = {
      id: responseData.userId,
      email: responseData.email,
      name: responseData.displayName,
      avatar: responseData.picture,
    };
    const subscribed = responseData.tier === "premium";
    const subscription = responseData.subscription || null;
    const hasSubscribedBefore = subscribed;

    await chrome.storage.local.set({
      aisrUser: user,
      lastAuthCheck: now,
      isLoggedIn: true,
      wasLoggedIn: false,
      isSubscribed: subscribed,
      proSubscription: subscription,
      hasSubscribedBefore: !!hasSubscribedBefore,
      pushToTalk: false,
      onboarding: false,
      showProSplash: false,
      ...(!instantMode
        ? {
            backgroundEffectsActive: false,
            backgroundEffect: "",
            fpsValue: "30",
          }
        : {}),
    });

    const { originalTabId } = await chrome.storage.local.get("originalTabId");

    if (originalTabId) {
      // Clear immediately so subsequent cached calls don't re-fire.
      await chrome.storage.local.remove("originalTabId");

      chrome.tabs.update(originalTabId, { active: true });

      sendMessageTab(originalTabId, { type: "LOGIN_SUCCESS" });

      sendMessageTab(originalTabId, {
        type: "check-auth",
      });
    }

    return {
      authenticated: true,
      user,
      subscribed: !!subscribed,
      proSubscription: subscription,
      hasSubscribedBefore: !!hasSubscribedBefore,
      cached: false,
      instantMode: instantMode || false,
    };
  } catch (err) {
    if (isTokenInvalid) {
      try {
        const { refreshSupabaseToken } = await import("./supabaseAuth");
        const newToken = await refreshSupabaseToken();
        if (newToken) {
          return await loginWithWebsite();
        }
      } catch (refreshErr) {
        console.error("❌ Refresh failed:", refreshErr.message);
      }

      // Token is invalid and refresh failed: perform full logout.
      await chrome.storage.local.remove([
        "aisrToken",
        "aisrUser",
        "lastAuthCheck",
        "isSubscribed",
        "proSubscription",
      ]);
      await chrome.storage.local.set({ isLoggedIn: false });
      return { authenticated: false, instantMode: false };
    }

    // Network/transient error: keep existing auth state instead of forcing logout.
    const {
      aisrUser,
      isSubscribed,
      proSubscription,
      hasSubscribedBefore,
    } = await chrome.storage.local.get([
      "aisrUser",
      "isSubscribed",
      "proSubscription",
      "hasSubscribedBefore",
    ]);

    if (aisrUser) {
      await chrome.storage.local.set({
        isLoggedIn: true,
        ...(!instantMode
          ? {
              backgroundEffectsActive: false,
              backgroundEffect: "",
              fpsValue: "30",
            }
          : {}),
      });

      return {
        authenticated: true,
        user: aisrUser,
        subscribed: !!isSubscribed,
        proSubscription: proSubscription || null,
        hasSubscribedBefore: !!hasSubscribedBefore,
        cached: true,
        instantMode: instantMode || false,
      };
    }

    await chrome.storage.local.set({ isLoggedIn: false });
    return {
      authenticated: false,
      instantMode: instantMode || false,
      transient: true,
      error: err?.message || "auth-check-failed",
    };
  }
};
