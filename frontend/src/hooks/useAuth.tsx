"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { purchaseMembershipRazorpay, type UserAddress } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Address shape is owned by lib/api.ts — reused here so the two can't drift.
type Address = UserAddress;

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  phone?: string | null;
  isMember?: boolean;
  emailVerified?: boolean;
  addresses?: Address[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, callbackUrl?: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string, isMember?: boolean, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateProfile: (firstName: string, lastName: string, phone?: string | null) => Promise<void>;
  becomeMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const isProduction = window.location.protocol === "https:";
  const secureFlag = isProduction ? ";Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`;
};

// Helper to delete cookie
const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

import { getCookie, getCsrfHeader } from "@/utils/cookie";
export { getCookie };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // The JWT lives in an HttpOnly cookie, so client JS can't read it to decide
  // login state — the backend reads it itself via `credentials: "include"`.
  //
  // The non-sensitive `role` cookie IS readable, and is written and cleared in
  // lockstep with the session, so its absence is a reliable "definitely signed
  // out". Checking it first lets an anonymous visitor skip the /me request
  // entirely, which saves a round-trip on every page load and avoids the
  // browser logging the resulting 401 as a console error (the browser reports
  // failed responses itself; JS cannot suppress that).
  const fetchProfile = async () => {
    if (!getCookie("role")) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Session gone or rejected — clear the hint cookie so subsequent loads
        // take the fast path above instead of retrying a doomed request.
        setUser(null);
        deleteCookie("role");
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string, callbackUrl?: string) => {
    setLoading(true);
    try {
      const sessionToken = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, sessionToken })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Login failed");
      }

      const data = await response.json();
      // The backend sets the auth token as an HttpOnly cookie itself — only
      // the (non-sensitive) role is kept in a JS-readable cookie for UI hints.
      setCookie("role", data.user.role);
      setUser(data.user);

      if (typeof window !== "undefined") {
        localStorage.removeItem("sessionToken");
      }

      // router.refresh() used to run here to pick up the fresh auth cookie in
      // server-rendered content, but every branch below navigates to a new
      // route regardless — which already fetches fresh server data on its
      // own. Keeping both meant two competing navigations: refresh() was
      // still fetching data for the *current* route ("/login") when push()
      // fired, and a stale response landing after the push could overwrite
      // the new route with "/login"'s own render. Redundant either way, and
      // one less source of races on top of the callbackUrl fix below.

      // Redirect based on callbackUrl or role
      if (callbackUrl && callbackUrl !== "/login") {
        router.push(callbackUrl);
      } else if (data.user.role === "ADMIN") {
        router.push("/admin/products");
      } else if (data.user.role === "VENDOR" || data.user.role === "vendor") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string, isMember: boolean = false, phone?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, isMember, phone: phone || undefined })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Registration failed");
      }

      const data = await response.json();
      setCookie("role", data.user.role);
      setUser(data.user);
      router.push("/");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    // The cookie is HttpOnly, so only the backend can clear it — and that has
    // to be awaited before navigating anywhere. proxy.ts redirects a request
    // to /login straight back to /admin (or /) whenever it sees a still-valid
    // token, so pushing to /login before this response lands sent an admin
    // right back into the console they'd just tried to leave.
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // Best-effort: still clear local state and navigate even if the
      // network call failed. The stale cookie, if any, is no worse off than
      // it was before logout was attempted.
    }
    deleteCookie("role");
    setUser(null);
    router.push("/login");
  };

  const updateProfile = async (firstName: string, lastName: string, phone?: string | null) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...getCsrfHeader(),
        },
        body: JSON.stringify({ firstName, lastName, phone })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to update profile");
      }
      const data = await response.json();
      setUser(data);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const becomeMember = async () => {
    setLoading(true);
    try {
      const updatedUser = await purchaseMembershipRazorpay();
      setUser(updatedUser);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        updateProfile,
        becomeMember
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
