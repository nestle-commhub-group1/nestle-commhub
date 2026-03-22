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
  const token = localStorage.getItem("token") || "";

  // Allow dev tokens in development mode
  const isDev = import.meta.env.DEV;
  const isDevToken = token?.startsWith("dev-token-");

  if (isDev && isDevToken) {
    // Allow dev tokens to pass through using the user from localStorage
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser) {
      // If roles are specified, check if the dev user has the required role
      if (roles) {
        const allowed = Array.isArray(roles) ? roles : [roles];
        if (!allowed.includes(storedUser.role)) {
          return <Navigate to="/unauthorized" replace />;
        }
      }
      return children;
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(user?.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

