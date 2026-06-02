import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process?.env?.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Local Mock Authentication state manager
const mockAuthListeners = new Set<(event: string, session: any) => void>();
let currentMockUser: any = null;
let currentMockSession: any = null;

// Load mock user from localStorage if it exists to preserve login state across refresh
if (typeof window !== 'undefined') {
  const savedUser = localStorage.getItem('VidFlow-mock-user');
  if (savedUser) {
    try {
      currentMockUser = JSON.parse(savedUser);
      currentMockSession = { user: currentMockUser, access_token: 'mock-access-token' };
    } catch (e) {
      console.error("Error loading mock user:", e);
    }
  }

  // Synchronize with chrome.storage.local to support cross-page login synchronization in Chrome Extension
  const syncWithChromeStorage = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["aisrToken", "aisrUser", "isLoggedIn"], (result) => {
        if (result.isLoggedIn && result.aisrUser) {
          const token = result.aisrToken || 'mock-access-token';
          const syncedUser = {
            id: result.aisrUser.id,
            email: result.aisrUser.email,
            user_metadata: {
              name: result.aisrUser.name,
              full_name: result.aisrUser.name,
              avatar_url: result.aisrUser.avatar,
              picture: result.aisrUser.avatar,
              provider: 'google'
            }
          };
          
          // Only update if state has actually changed to avoid infinite loop / redundant triggers
          if (!currentMockUser || currentMockUser.id !== syncedUser.id) {
            currentMockUser = syncedUser;
            currentMockSession = { user: currentMockUser, access_token: token };
            localStorage.setItem('VidFlow-mock-user', JSON.stringify(currentMockUser));
            mockAuthListeners.forEach(listener => listener('SIGNED_IN', currentMockSession));
          }
        } else if (result.isLoggedIn === false && currentMockUser) {
          currentMockUser = null;
          currentMockSession = null;
          localStorage.removeItem('VidFlow-mock-user');
          mockAuthListeners.forEach(listener => listener('SIGNED_OUT', null));
        }
      });
    }
  };

  // Run initial sync
  syncWithChromeStorage();

  // Listen for storage changes from other context pages (e.g. Popup sign in / sign out)
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && (changes.isLoggedIn || changes.aisrUser)) {
        syncWithChromeStorage();
      }
    });
  }
}

// Safe mock client for offline extension usage when Supabase is not configured
const mockSupabaseClient = {
  auth: {
    getUser: async () => ({ data: { user: currentMockUser }, error: null }),
    getSession: async () => ({ data: { session: currentMockSession }, error: null }),
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      mockAuthListeners.add(callback);
      // Immediately notify active state to sync Context Providers
      callback(currentMockUser ? 'SIGNED_IN' : 'INITIAL_SESSION', currentMockSession);
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              mockAuthListeners.delete(callback);
            } 
          } 
        } 
      };
    },
    signOut: async () => {
      const token = currentMockSession?.access_token;
      currentMockUser = null;
      currentMockSession = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('VidFlow-mock-user');
      }

      // Revoke and remove cached token if in Chrome Extension context to force prompting next time
      if (token && token !== 'mock-access-token') {
        if (typeof chrome !== 'undefined' && chrome.identity) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            console.log("Chrome cached auth token removed.");
          });
        }
        
        // Revoke token from Google servers to completely clear permission grants
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch((err) => {
          console.warn("Failed to revoke token from Google servers:", err);
        });
      }

      // Clean up chrome.storage.local keys upon sign out
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove([
          "aisrToken",
          "aisrUser",
          "lastAuthCheck",
          "isSubscribed",
          "isLoggedIn",
          "proSubscription",
        ]);
        chrome.storage.local.set({
          isLoggedIn: false,
          wasLoggedIn: false,
          stayLoggedOut: true,
          isSubscribed: false,
          proSubscription: null,
          aisrUser: null,
        });
      }

      mockAuthListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    },
    signInWithOAuth: async (options: { provider: string }) => {
      const provider = options.provider;

      // REAL GOOGLE AUTH VIA CHROME IDENTITY API (In unpacked Chrome Extension context)
      if (provider === 'google' && typeof chrome !== 'undefined' && chrome.identity) {
        return new Promise<{ data: any, error: any }>((resolve) => {
          // If we want to guarantee the user is prompted to select a Google account:
          // We can request interactive: true, which forces UI dialog if no cached token is active
          chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            if (chrome.runtime.lastError || !token) {
              console.error("Chrome Identity Error:", chrome.runtime.lastError);
              resolve({ data: null, error: new Error(chrome.runtime.lastError?.message || "Failed to get auth token. Please check extension permissions.") });
              return;
            }

            try {
              // Fetch real user info from Google
              const res = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`);
              if (!res.ok) throw new Error("Failed to fetch user info from Google");
              const userInfo = await res.json();

              currentMockUser = {
                id: userInfo.id,
                email: userInfo.email,
                user_metadata: {
                  name: userInfo.name,
                  full_name: userInfo.name,
                  first_name: userInfo.given_name,
                  last_name: userInfo.family_name,
                  avatar_url: userInfo.picture,
                  picture: userInfo.picture,
                  provider: 'google'
                }
              };
              
              currentMockSession = { user: currentMockUser, access_token: token };

              if (typeof window !== 'undefined') {
                localStorage.setItem('VidFlow-mock-user', JSON.stringify(currentMockUser));
              }

              // Store auth state in chrome.storage.local for background script sync
              if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const bgUser = {
                  id: userInfo.id,
                  email: userInfo.email,
                  name: userInfo.name || userInfo.email?.split("@")[0] || "",
                  avatar: userInfo.picture || "",
                };
                chrome.storage.local.set({
                  aisrToken: token,
                  aisrRefreshToken: "managed-by-chrome",
                  aisrUser: bgUser,
                  isLoggedIn: true,
                  wasLoggedIn: false,
                  stayLoggedOut: false,
                  lastAuthCheck: Date.now(),
                });

                // Fetch user profile from backend (creates user in Firestore if needed)
                const API_BASE = "https://openvid-backend-676582412453.us-central1.run.app";
                fetch(`${API_BASE}/api/user`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
                  .then((res) => {
                    if (res.ok) return res.json();
                  })
                  .then((backendUser) => {
                    if (backendUser) {
                      const quotaExhausted = backendUser.tier === "premium" && (backendUser.credits !== undefined && Number(backendUser.credits) <= 0);
                      chrome.storage.local.set({
                        isSubscribed: backendUser.tier === "premium",
                        proSubscription: backendUser.subscription || null,
                        quotaExhausted: quotaExhausted,
                      });
                    }
                  })
                  .catch((err) => {
                    console.warn("[Auth Client] Backend user fetch failed:", err.message);
                  });
              }

              mockAuthListeners.forEach(listener => listener('SIGNED_IN', currentMockSession));
              resolve({ data: { provider, url: '' }, error: null });
            } catch (err: any) {
              console.error("Failed to fetch Google profile:", err);
              resolve({ data: null, error: err });
            }
          });
        });
      }

      // MOCK FALLBACK (When testing on standard browser context without chrome.identity API)
      return new Promise<{ data: any, error: any }>((resolve) => {
        // Implement an interactive consent confirm dialog on standard browser preview
        if (typeof window !== 'undefined') {
          const consent = window.confirm(
            `GOOGLE AUTHENTICATION (WEB PREVIEW MOCK):\n\n` +
            `Ứng dụng VidFlow đang yêu cầu đăng nhập và lấy thông tin tài khoản Google:\n` +
            `- Email: alvesoscar517@gmail.com\n` +
            `- Họ tên: Oscar Alves\n` +
            `- Ảnh đại diện Google\n\n` +
            `Nhấn OK để cấp quyền và đăng nhập. Nhấn Cancel để từ chối.`
          );

          if (!consent) {
            resolve({ data: null, error: new Error("Hủy đăng nhập Google.") });
            return;
          }
        }

        const displayName = provider === 'github' ? 'Oscar Alves (GitHub)' : provider === 'google' ? 'Oscar Alves (Google)' : 'Oscar Alves';
        const avatarUrl = provider === 'github' 
          ? 'https://api.dicebear.com/7.x/bottts/svg?seed=OscarGitHub' 
          : 'https://api.dicebear.com/7.x/bottts/svg?seed=OscarGoogle';

        currentMockUser = {
          id: `mock-user-id-${Date.now()}`,
          email: provider === 'google' ? 'alvesoscar517@gmail.com' : `mock.${provider}@example.com`,
          user_metadata: {
            name: displayName,
            full_name: displayName,
            avatar_url: avatarUrl,
            picture: avatarUrl,
            provider: provider
          }
        };
        
        currentMockSession = { user: currentMockUser, access_token: 'mock-access-token' };

        if (typeof window !== 'undefined') {
          localStorage.setItem('VidFlow-mock-user', JSON.stringify(currentMockUser));
        }

        mockAuthListeners.forEach(listener => listener('SIGNED_IN', currentMockSession));
        resolve({ data: { provider, url: '' }, error: null });
      });
    },
  },
  // Simulate database tables like user_profiles
  from: (table: string) => {
    return {
      select: () => ({
        eq: () => ({
          single: async () => {
            if (table === 'user_profiles' && currentMockUser) {
              return {
                data: {
                  id: currentMockUser.id,
                  email: currentMockUser.email,
                  full_name: currentMockUser.user_metadata.full_name,
                  first_name: currentMockUser.user_metadata.first_name || currentMockUser.user_metadata.full_name?.split(' ')[0] || 'User',
                  last_name: currentMockUser.user_metadata.last_name || currentMockUser.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
                  avatar_url: currentMockUser.user_metadata.avatar_url,
                  provider: currentMockUser.user_metadata.provider,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                error: null
              };
            }
            return { data: null, error: null };
          }
        })
      })
    };
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: new Error("Offline mode") }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
} as any;

export const createClient = () => {
  // We strictly enforce mock/offline client for the offline-mode Chrome Extension
  return mockSupabaseClient;
};

