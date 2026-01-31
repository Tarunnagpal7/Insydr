"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi, getErrorMessage } from "@/src/lib/auth";
import { useAppDispatch } from "@/src/store/hooks";
import { setCredentials } from "@/src/store/auth.store";
import Logo from "@/src/components/ui/Logo";
import Loading from "@/src/components/ui/Loading";

// Icons
const BotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="10" x="3" y="11" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" x2="8" y1="16" y2="16" />
    <line x1="16" x2="16" y1="16" y2="16" />
  </svg>
);

const MailCheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    <path d="m16 19 2 2 4-4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

function VerifyOTPContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const purpose = (searchParams.get("purpose") as "email_verification" | "password_reset") || "email_verification";
  
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle paste
    if (value.length > 1) {
      const pastedValues = value.slice(0, 6).split("");
      pastedValues.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedValues.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (!email) {
      setError("Invalid verification link. Please sign up again.");
      return;
    }
    
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (purpose === "email_verification") {
        const response = await authApi.verifyOTP(email, otpCode);
        // Update Redux store with credentials
        dispatch(setCredentials({
          user: response.user,
          token: response.access_token,
        }));
        router.push("/dashboard");
      } else {
        // For password reset, redirect to reset password page with OTP
        router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${otpCode}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setError("");
    setSuccess("");

    try {
      await authApi.resendOTP(email, purpose);
      setSuccess("A new OTP has been sent to your email");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background-secondary text-foreground">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-background rounded-2xl shadow-xl p-8 border border-border">
          {/* Logo */}
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-milano-50 dark:bg-milano-900/30 text-primary flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-inset ring-milano-100">
            <MailCheckIcon />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verify your email
            </h1>
            <p className="text-foreground-secondary">
              We've sent a 6-digit code to
            </p>
            <p className="text-foreground font-medium">{email}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-milano-50 border border-milano-200 text-milano-800 animate-fade-in">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span className="font-medium text-sm">{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-success/10 border border-success/20 text-success-dark animate-fade-in">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="font-medium text-sm">{success}</span>
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleSubmit}>
            {/* OTP Inputs */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.some((d) => !d)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 mb-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-foreground-secondary text-sm mb-2">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className="text-primary hover:text-primary-hover font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resending ? (
                  "Sending..."
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>
          </form>

          {/* Back Link */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-foreground-secondary hover:text-foreground mt-8 transition-colors font-medium hover:underline underline-offset-2"
          >
            <ArrowLeftIcon />
            Back to login
          </Link>
        </div>

        {/* Hint */}
        <p className="text-center text-foreground-muted text-sm mt-6">
          Check your spam folder if you don't see the email
        </p>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
