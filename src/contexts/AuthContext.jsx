import { useEffect, useState, useCallback } from "react";
import { AuthContext } from "./auth-context.js";
import { apiRequest, refreshSession, UnauthorizedError } from "../lib/api.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/auth/me", {
        skipApiVersion: true,
      });
      setUser(response.data);
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        const refreshed = await refreshSession();
        if (refreshed) {
          try {
            const retry = await apiRequest("GET", "/auth/me", {
              skipApiVersion: true,
            });
            setUser(retry.data);
            return true;
          } catch {
            setUser(null);
            return false;
          }
        }
      }
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchUser();
      if (!cancelled) setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", "/auth/logout", { skipApiVersion: true });
    } catch {
      // proceed with local logout regardless
    }
    setUser(null);
  }, []);

  const value = {
    user,
    loading: !authChecked,
    isAuthenticated: user !== null,
    isAdmin: user?.role === "admin",
    refresh: fetchUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
