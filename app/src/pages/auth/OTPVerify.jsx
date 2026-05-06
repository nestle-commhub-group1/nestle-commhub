import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import API_URL from "../../config/api";
import AuthLayout from "../../components/AuthLayout";

const OTP_LENGTH = 6;
const TIMER_SECONDS = 5 * 60; // 5 minutes

export default function OTPVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purpose = searchParams.get("purpose") || "forgot_password";
  const userId  = searchParams.get("userId") || "";

  // ── OTP digit state ──────────────────────────────────────────────────────
  const [digits, setDigits]   = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs             = useRef([]);

  // ── Timer state ──────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft]   = useState(TIMER_SECONDS);
  const timerRef                   = useRef(null);
  const expired                    = timeLeft === 0;

  // ── UI state ─────────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(false);
  const [resending, setResending]     = useState(false);
  const [error, setError]             = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [locked, setLocked]           = useState(false); // 429 lockout
  const [resendMsg, setResendMsg]     = useState("");

  // ── Timer helpers ────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    // Auto-focus first input
    inputRefs.current[0]?.focus();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  // ── OTP input handlers ───────────────────────────────────────────────────
  function handleDigitChange(index, value) {
    // Accept only a single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
      }
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    [...pasted].forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    // Focus the last filled box or the one after
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/otp/verify`,
        { otp, purpose, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (purpose === "forgot_password") {
        navigate(`/reset-password?token=${res.data.resetToken}&userId=${res.data.userId}`);
      } else if (purpose === "login") {
        // login flow already completed; redirect to appropriate dashboard
        navigate("/");
      }
    } catch (err) {
      const status = err.response?.status;
      const data   = err.response?.data;

      if (status === 429) {
        setLocked(true);
        setError("Too many attempts. Please request a new OTP.");
      } else {
        setError(data?.message || "Verification failed. Please try again.");
        if (data?.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Resend ───────────────────────────────────────────────────────────────
  async function handleResend() {
    setResending(true);
    setError("");
    setResendMsg("");
    setAttemptsLeft(null);
    setLocked(false);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/api/otp/send`,
        { purpose },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      startTimer();
      setResendMsg("New OTP sent!");
      setTimeout(() => setResendMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Enter OTP</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the 6-digit code sent to your registered phone number
          </p>
        </div>

        {/* Timer */}
        <div className="mb-6 text-center">
          {expired ? (
            <p className="text-sm font-semibold text-red-500">OTP expired</p>
          ) : (
            <p className="text-sm text-gray-500">
              OTP expires in{" "}
              <span className="font-semibold text-[#3D2B1F]">{formatTime(timeLeft)}</span>
            </p>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Resend success banner */}
        {resendMsg && (
          <div className="mb-5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm text-center">
            {resendMsg}
          </div>
        )}

        {/* Attempts warning */}
        {attemptsLeft === 1 && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm text-center font-medium">
            ⚠️ Warning: 1 attempt remaining
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* 6-digit OTP boxes */}
          <div className="flex justify-between gap-2 mb-6">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={locked || expired}
                className={`w-12 h-14 text-center text-xl font-bold rounded-lg outline-none border-2 transition-colors bg-[#F5F5F5] text-[#3D2B1F]
                  ${digit ? "border-[#3D2B1F]" : "border-transparent"}
                  focus:border-[#3D2B1F]
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            ))}
          </div>

          {/* Locked state: show Request New OTP instead of submit */}
          {locked ? (
            <Link
              to="/forgot-password"
              className="block w-full text-center bg-[#3D2B1F] text-white text-sm font-semibold rounded-lg py-3.5 hover:bg-[#2e1f15] transition-all"
            >
              Request New OTP
            </Link>
          ) : (
            <button
              type="submit"
              disabled={loading || expired}
              className="w-full bg-[#3D2B1F] text-white text-sm font-semibold rounded-lg py-3.5 hover:bg-[#2e1f15] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          )}
        </form>

        {/* Resend */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={!expired || resending || locked}
            className="text-sm font-semibold text-[#3D2B1F] hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline transition-opacity"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/forgot-password" className="text-[#3D2B1F] font-semibold hover:underline">
            Back
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
