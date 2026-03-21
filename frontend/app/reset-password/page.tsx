"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi, getErrorMessage } from "@/src/lib/auth";
import GuestGuard from "@/src/components/auth/GuestGuard";
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

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const otp = searchParams.get("otp") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validatePassword = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
    };
  };

  const passwordChecks = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp) {
      setError("Invalid password reset link. Please request a new one.");
      return;
    }
    
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordChecks.minLength) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.resetPassword(email, otp, formData.password);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            Password Reset Complete
          </h1>
          <p className="text-zinc-400 text-sm mb-8">
            Your password has been successfully reset. You can now log in with your new password.
          </p>

          <Link href="/login" className="w-full relative group overflow-hidden rounded-xl inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[url('/noise.png')] mix-blend-overlay transition-opacity duration-300" />
            <div className="absolute -inset-1 bg-red-400/30 blur-xl group-hover:bg-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="w-full relative flex items-center justify-center gap-2 px-6 py-3.5 text-white font-medium shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              Continue to Login
            </div>
          </Link>
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
          <ShieldCheckIcon />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Set new password
          </h1>
          <p className="text-zinc-400 text-sm">
            Your new password must be different from previously used passwords.
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-400 transition-colors">
                <LockIcon />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-11 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all sm:text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/10"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Password Strength */}
            {formData.password && (
              <div className="mt-3 ml-1 space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${passwordChecks.minLength ? 'bg-emerald-500 text-white' : 'bg-white/10 text-transparent'}`}>
                    {passwordChecks.minLength && <CheckIcon />}
                  </div>
                  <span className={passwordChecks.minLength ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${passwordChecks.hasNumber ? 'bg-emerald-500 text-white' : 'bg-white/10 text-transparent'}`}>
                    {passwordChecks.hasNumber && <CheckIcon />}
                  </div>
                  <span className={passwordChecks.hasNumber ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                    Contains a number
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-400 transition-colors">
                <LockIcon />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={`w-full pl-11 pr-4 py-3 bg-zinc-950/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all sm:text-sm ${
                  formData.confirm_password && formData.password !== formData.confirm_password 
                    ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' 
                    : 'border-white/10 focus:border-red-500/50 focus:ring-red-500/20 placeholder:text-zinc-600'
                }`}
                placeholder="••••••••"
                required
              />
            </div>
            {formData.confirm_password && formData.password !== formData.confirm_password && (
              <p className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1 font-medium animate-fade-in">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden rounded-xl mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[url('/noise.png')] mix-blend-overlay transition-opacity duration-300" />
            <div className="absolute -inset-1 bg-red-400/30 blur-xl group-hover:bg-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex items-center justify-center gap-2 px-6 py-3.5 text-white font-medium shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

export default function ResetPasswordPage() {
  return (
    <GuestGuard>
      <ResetPasswordWrapper />
    </GuestGuard>
  );
}
