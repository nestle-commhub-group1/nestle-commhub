/**
 * Login.jsx
 *
 * The login page for all user roles (retailer, staff, admin, distributor).
 *
 * Key responsibilities:
 * - Validates email format and password presence before submitting
 * - Calls /api/auth/login and stores the JWT + user object via AuthContext
 * - Redirects the user to their role-appropriate dashboard after login
 */

import { useState }         from "react";
import { Link, useNavigate } from "react-router-dom";
import axios                from "axios";
import API_URL              from "../../config/api";
import AuthLayout           from "../../components/AuthLayout";
import { useAuth }          from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from global auth state

  // Form field values — controlled inputs
  const [form, setForm]         = useState({ email: "", password: "" });
  // Per-field validation error messages (displayed below each input)
  const [errors, setErrors]     = useState({});
  // Global error message shown at the top of the form (e.g., wrong password)
  const [globalError, setGlobalError] = useState("");
  // Toggle to show/hide the password characters
  const [showPassword, setShowPassword] = useState(false);
  // Prevents double-submission while the API request is in-flight
  const [loading, setLoading]   = useState(false);

  /* ── Client-side validation ──────────────────────────────────────────── */

  // Returns an object of field → error message.
  // An empty object means the form is valid and ready to submit.
  function validate() {
    const e = {};
    if (!form.email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address.";
    }
    if (!form.password) {
      e.password = "Password is required.";
    }
    return e;
  }

  // Clear the field error as soon as the user starts typing again,
  // and also clear the global error so stale messages don't persist
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (globalError) setGlobalError("");
  }

  /* ── Form submission ─────────────────────────────────────────────────── */

  async function handleSubmit(e) {
    e.preventDefault();  // Prevent the browser's default form submission (page reload)
    setGlobalError("");

    // Run client-side validation first — stop here if there are errors
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, form);
      const { user, token } = response.data;

      // Store the JWT token and user object in AuthContext AND localStorage.
      // localStorage ensures the user stays logged in after a page refresh.
      login(user, token);

      // Redirect to the correct dashboard based on the user's role.
      // Each role has a completely separate section of the app.
      const roleRedirects = {
        retailer:    "/retailer/dashboard",
        sales_staff: "/staff/dashboard",
        hq_admin:    "/admin/dashboard",
        distributor: "/distributor/dashboard",
      };

      const target = roleRedirects[user.role] || "/unauthorized";
      navigate(target);

    } catch (err) {
      console.error("Login error:", err);
      // Show the server's error message if available; otherwise show a generic fallback
      if (err.response && err.response.data && err.response.data.message) {
        setGlobalError(err.response.data.message);
      } else {
        setGlobalError("Failed to connect to server. Please try again.");
      }
    } finally {
      setLoading(false); // Always re-enable the button, even on error
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your Nestlé CommHub account
          </p>
        </div>

        {/* Global error banner — shown when the server rejects the login */}
        {globalError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Email field */}
          <div>
            <label className="block text-sm font-semibold text-[#3D2B1F] mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none border transition-colors
                ${errors.email
                  ? "border-red-400 focus:border-red-500"
                  : "border-transparent focus:border-[#3D2B1F]"
                }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-[#3D2B1F]">
                Password <span className="text-red-500">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#3D2B1F] underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 outline-none border transition-colors
                  ${errors.password
                    ? "border-red-400 focus:border-red-500"
                    : "border-transparent focus:border-[#3D2B1F]"
                  }`}
              />
              {/* Show/hide password toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#3D2B1F] transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Submit button — disabled while the API request is pending */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3D2B1F] text-white text-sm font-semibold rounded-lg py-3.5 mt-2 hover:bg-[#2e1f15] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Link to registration page */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-[#3D2B1F] font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
