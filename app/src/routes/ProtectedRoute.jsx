/**
 * ProtectedRoute.jsx
 *
 * A wrapper component that guards pages from unauthorised access.
 *
 * Key responsibilities:
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated users with the wrong role to /unauthorized
 * - Allows dev tokens to bypass real JWT verification during development
 */

import { Navigate } from "react-router-dom";
import { useAuth }  from "../context/AuthContext";

/**
 * ProtectedRoute
 *
 * @param {React.ReactNode} children  - The page component to render if access is granted
 * @param {string|string[]} roles     - Allowed role(s). Pass undefined to allow any logged-in user.
 *
 * In development mode (import.meta.env.DEV), tokens starting with "dev-token-"
 * are treated as valid so the DevLauncher bypass works without a real backend.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem("token") || "";

  // Check if we are running in Vite's development mode
  const isDev      = import.meta.env.DEV;
  const isDevToken = token?.startsWith("dev-token-");

  /* ── Dev token bypass ────────────────────────────────────────────────── */

  // In development, the DevLauncher issues fake "dev-token-<role>" tokens
  // that let developers quickly test each role's UI without going through login.
  // This block intercepts those tokens before the real auth check.
  if (isDev && isDevToken) {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (storedUser) {
      // If the route has a role requirement, still check it — even in dev mode.
      // This prevents a "dev-token-retailer" from accidentally accessing admin pages.
      if (roles) {
        const allowed = Array.isArray(roles) ? roles : [roles];
        if (!allowed.includes(storedUser.role)) {
          return <Navigate to="/unauthorized" replace />;
        }
      }
      return children; // Dev user has the right role — render the page
    }
  }

  /* ── Authentication check ────────────────────────────────────────────── */

  // isAuthenticated is true if a real JWT token exists in AuthContext.
  // If not logged in at all, redirect to /login so they can authenticate.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /* ── Role check ──────────────────────────────────────────────────────── */

  // If the route specifies allowed roles, check that the logged-in user has one.
  // roles can be a single string ("retailer") or an array (["hq_admin", "staff"]).
  // If the user's role doesn't match, send them to the /unauthorized page.
  if (roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(user?.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // All checks passed — render the actual page content
  return children;
}
