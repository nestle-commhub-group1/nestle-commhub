import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * @param {React.ReactNode} children  - The page to render if access is granted
 * @param {string|string[]} roles     - Allowed role(s). Pass undefined to allow any authenticated user.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();

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
