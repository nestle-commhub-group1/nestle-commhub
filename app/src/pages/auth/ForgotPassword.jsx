import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../../config/api";
import AuthLayout from "../../components/AuthLayout";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail]         = useState("");
  const [emailError, setEmailError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(null); // { maskedPhone, userId }

  function validate() {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError("");

    const err = validate();
    if (err) {
      setEmailError(err);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSuccess({
        maskedPhone: res.data.maskedPhone,
        userId: res.data.userId,
      });
    } catch (err) {
      setGlobalError(
        err.response?.data?.message || "Failed to connect to server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md px-8 py-10 text-center">
          {/* Green checkmark */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#3D2B1F] mb-2">OTP Sent!</h1>
          <p className="text-sm text-gray-500 mb-8">
            An OTP has been sent to <span className="font-semibold text-[#3D2B1F]">{success.maskedPhone}</span>
          </p>

          <button
            onClick={() =>
              navigate(`/verify-otp?purpose=forgot_password&userId=${success.userId}`)
            }
            className="w-full bg-[#3D2B1F] text-white text-sm font-semibold rounded-lg py-3.5 hover:bg-[#2e1f15] active:scale-[0.98] transition-all"
          >
            Enter OTP
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link to="/login" className="text-[#3D2B1F] font-semibold hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email address and we'll send an OTP to your registered phone number
          </p>
        </div>

        {/* Global error banner */}
        {globalError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Email field */}
          <div>
            <label className="block text-sm font-semibold text-[#3D2B1F] mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
                setGlobalError("");
              }}
              className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none border transition-colors
                ${emailError
                  ? "border-red-400 focus:border-red-500"
                  : "border-transparent focus:border-[#3D2B1F]"
                }`}
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-red-500">{emailError}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3D2B1F] text-white text-sm font-semibold rounded-lg py-3.5 mt-2 hover:bg-[#2e1f15] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        {/* Back to login */}
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-[#3D2B1F] font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
