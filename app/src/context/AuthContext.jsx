import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("commhub_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("commhub_token") || null;
  });

  const isAuthenticated = !!token;

  function login(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("commhub_user", JSON.stringify(userData));
    localStorage.setItem("commhub_token", jwt);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("commhub_user");
    localStorage.removeItem("commhub_token");
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
