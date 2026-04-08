/**
 * AuthContext.jsx
 *
 * Global authentication state for the entire application.
 *
 * Key responsibilities:
 * - Stores the current user object and JWT token in React state
 * - Persists auth data to localStorage so the user stays logged in after a page refresh
 * - Provides login() and logout() functions to all components via the useAuth() hook
 */

import { createContext, useContext, useState, useEffect } from "react";

// Create the context object — null is the default value before the provider mounts
const AuthContext = createContext(null);

/* ─── AuthProvider ────────────────────────────────────────────────────────── */

export function AuthProvider({ children }) {

  // Initialise user state from localStorage on first render.
  // This means if the user refreshes the page, they remain logged in
  // rather than being sent back to the login screen.
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Initialise token state from localStorage too —
  // the token is needed for API requests throughout the app
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // Derived boolean — true if a token exists, false if the user is not logged in.
  // Used by ProtectedRoute to decide whether to render the page or redirect to /login.
  const isAuthenticated = !!token;

  /* ── login() ─────────────────────────────────────────────────────────── */

  // Called after a successful /api/auth/login or /api/auth/register response.
  // Saves both the user profile and JWT token to state AND localStorage
  // so they survive page refreshes.
  function login(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("user",  JSON.stringify(userData));
    localStorage.setItem("token", jwt);
  }

  /* ── logout() ────────────────────────────────────────────────────────── */

  // Clears all auth state from both React state and localStorage.
  // After this runs, isAuthenticated becomes false and protected routes
  // will redirect the user back to /login.
  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  // Sync state if localStorage already has valid auth data when the app first mounts.
  // This handles the case where the user hard-refreshes the page — the state
  // initialiser above handles this too, but this effect is an extra safety net.
  useEffect(() => {
    const storedUser  = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []); // Empty dependency array = runs once on mount only

  return (
    // Provide user, token, isAuthenticated, login, and logout to the entire component tree
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── useAuth ─────────────────────────────────────────────────────────────── */

// Custom hook that components use to access auth state.
// Throws an error if used outside of <AuthProvider> to catch mistakes early.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
