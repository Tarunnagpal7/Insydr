"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, getErrorMessage } from "@/src/lib/auth";
import GuestGuard from "@/src/components/auth/GuestGuard";
import Logo from "@/src/components/ui/Logo";

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

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const KeyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3L22 7l-3-3" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden text-white selection:bg-red-500/30">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-red-900/30 rounded-full blur-[100px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-orange-500/10 rounded-full blur-[80px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '5s', animationDelay: '2s' }} />
        
        {/* Noise Overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

        {/* Glass Container */}
        <div className="w-full max-w-[420px] p-8 sm:p-10 mx-4 bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] relative z-10 animate-fade-in-up text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          {/* Success Icon */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-inset ring-emerald-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Check your email
          </h1>
          <p className="text-zinc-400 text-sm mb-6">
            If an account exists with <strong className="text-white">{email}</strong>, we've sent a password reset code.
          </p>

          <Link
            href={`/verify-otp?email=${encodeURIComponent(email)}&purpose=password_reset`}
            className="w-full relative group overflow-hidden rounded-xl mb-6 inline-flex"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[url('/noise.png')] mix-blend-overlay transition-opacity duration-300" />
            <div className="absolute -inset-1 bg-red-400/30 blur-xl group-hover:bg-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="w-full relative flex items-center justify-center gap-2 px-6 py-3.5 text-white font-medium shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              Enter Reset Code
            </div>
          </Link>

          <p className="text-sm text-zinc-500">
            Didn't receive an email? Check your spam folder or{" "}
            <button
              onClick={() => setSubmitted(false)}
              className="text-white font-medium hover:text-red-400 hover:underline underline-offset-4 transition-colors"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden text-white selection:bg-red-500/30">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-red-900/30 rounded-full blur-[100px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-orange-500/10 rounded-full blur-[80px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      
      {/* Noise Overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      {/* Glass Container */}
      <div className="w-full max-w-[420px] p-8 sm:p-10 mx-4 bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-inset ring-white/10">
          <KeyIcon />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Forgot password?
          </h1>
          <p className="text-zinc-400 text-sm">
            No worries! Enter your email and we'll send you a reset code.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-fade-in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <span className="font-medium text-sm leading-tight">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-400 transition-colors">
                <MailIcon />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all sm:text-sm"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[url('/noise.png')] mix-blend-overlay transition-opacity duration-300" />
            <div className="absolute -inset-1 bg-red-400/30 blur-xl group-hover:bg-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex items-center justify-center gap-2 px-6 py-3.5 text-white font-medium shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Reset Code</span>
              )}
            </div>
          </button>
        </form>

        {/* Back Link */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-zinc-400 hover:text-white mt-8 transition-colors text-sm font-medium underline-offset-4 hover:underline"
        >
          <ArrowLeftIcon />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <ForgotPasswordForm />
    </GuestGuard>
  );
}
