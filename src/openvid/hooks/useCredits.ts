import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

interface UserCredits {
  credits: number;
  tier: "free" | "premium";
}

const API_BASE = (import.meta.env?.VITE_API_BASE || "https://openvid-backend-676582412453.us-central1.run.app").replace(/\/$/, "");

export function useCredits() {
  const { user, session } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!user || !session?.access_token) {
      setCredits(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        headers: { 
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCredits({ 
          credits: data.credits ?? 0, 
          tier: (data.tier === "premium" ? "premium" : "free") as "free" | "premium"
        });
      }
    } catch (err) {
      console.error("[useCredits] Failed to fetch user credits:", err);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { credits, loading, refreshCredits: fetchCredits };
}
