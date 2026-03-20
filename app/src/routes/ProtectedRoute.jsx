import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * @param {React.ReactNode} children  - The page to render if access is granted
 * @param {string|string[]} roles     - Allowed role(s). Pass undefined to allow any authenticated user.
 *
 * In development mode (import.meta.env.DEV), tokens starting with "dev-token-"
 * are treated as valid so the DevLauncher bypass works without a real backend.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();

  // Allow dev bypass tokens in development only
  const token = localStorage.getItem("token") || "";
  const isDevToken = import.meta.env.DEV && token.startsWith("dev-token-");

  if (!isAuthenticated && !isDevToken) {
    return <Navigate to="/login" replace />;
  }

  // For dev tokens read the role directly from localStorage user object
  const effectiveUser = isDevToken && !isAuthenticated
    ? (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })()
    : user;

  if (roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(effectiveUser?.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

