"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  // Logout action
  const logout = useCallback(() => {
    localStorage.removeItem("devspace_token");
    localStorage.removeItem("devspace_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  // Auth fetch wrapper injecting JWT header
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      const storedToken = localStorage.getItem("devspace_token");
      if (storedToken) {
        headers.set("Authorization", `Bearer ${storedToken}`);
      }
      
      const response = await fetch(url, { ...options, headers });
      
      // Auto-logout if token is expired or invalid
      if (response.status === 401 || response.status === 403) {
        logout();
      }
      return response;
    },
    [logout]
  );

  // Initialize and load token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("devspace_token");
      const storedUser = localStorage.getItem("devspace_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          // Verify token is still valid with backend
          const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              const updatedUser = {
                id: data.user.userId,
                username: data.user.username,
                email: data.user.email,
              };
              setUser(updatedUser);
              localStorage.setItem("devspace_user", JSON.stringify(updatedUser));
            }
          } else {
            logout();
          }
        } catch (err) {
          console.error("Token verification failed, offline mode active:", err);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [BACKEND_URL, logout]);

  // Login action
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      localStorage.setItem("devspace_token", data.token);
      
      const userProfile = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      };
      localStorage.setItem("devspace_user", JSON.stringify(userProfile));

      setToken(data.token);
      setUser(userProfile);
      
      router.push("/");
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Unable to connect to authentication server." };
    }
  };

  // Signup action
  const signup = async (username: string, email: string, password: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      localStorage.setItem("devspace_token", data.token);
      
      const userProfile = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      };
      localStorage.setItem("devspace_user", JSON.stringify(userProfile));

      setToken(data.token);
      setUser(userProfile);

      router.push("/");
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Unable to connect to authentication server." };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
