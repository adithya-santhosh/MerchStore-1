"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

interface Address {
  id: number;
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  phone?: string | null;
  isMember?: boolean;
  addresses?: Address[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string, isMember?: boolean) => Promise<void>;
  logout: () => void;
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

import { getCookie } from "@/utils/cookie";
export { getCookie };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Clear corrupt or expired token
        logout();
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      fetchProfile(token);
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const sessionToken = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, sessionToken })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Login failed");
      }

      const data = await response.json();
      setCookie("token", data.token);
      setCookie("role", data.user.role);
      setUser(data.user);

      if (typeof window !== "undefined") {
        localStorage.removeItem("sessionToken");
      }
      
      // Redirect based on role
      if (data.user.role === "ADMIN") {
        router.push("/admin/products");
      } else if (data.user.role === "VENDOR" || data.user.role === "vendor") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string, isMember: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, isMember })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Registration failed");
      }

      const data = await response.json();
      setCookie("token", data.token);
      setCookie("role", data.user.role);
      setUser(data.user);
      router.push("/");
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    deleteCookie("token");
    deleteCookie("role");
    setUser(null);
    router.push("/login");
  };

  const updateProfile = async (firstName: string, lastName: string, phone?: string | null) => {
    setLoading(true);
    try {
      const token = getCookie("token");
      if (!token) throw new Error("Not authenticated");
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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
      const token = getCookie("token");
      if (!token) throw new Error("Not authenticated");
      const response = await fetch(`${API_URL}/api/auth/become-member`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to join membership");
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
