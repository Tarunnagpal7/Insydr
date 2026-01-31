"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/src/lib/auth";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { loginUser } from "@/src/store/auth.store";
import GuestGuard from "@/src/components/auth/GuestGuard";
import Logo from "@/src/components/ui/Logo";

// Icons
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

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading: loading, error: authError } = useAppSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const result = await dispatch(loginUser({
        email: formData.email,
        password: formData.password,
      })).unwrap();
      
      if (result) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : getErrorMessage(err));
    }
  };

  const displayError = error || authError;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-10">
            <Logo size="lg" />
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Welcome back
            </h1>
            <p className="text-foreground-secondary text-lg">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error Alert */}
          {displayError && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-milano-50 border border-milano-200 text-milano-800 animate-fade-in">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span className="font-medium text-sm">{displayError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary-hover font-medium hover:underline underline-offset-2 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors p-1 rounded-md"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Signup Link */}
          <p className="text-center text-foreground-secondary mt-8 font-medium">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:text-primary-hover font-bold hover:underline underline-offset-2 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-milano-800 to-milano-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        <div className="max-w-lg text-center text-white relative z-10">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20 shadow-xl">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Build Smarter Conversations
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Create AI chatbots that understand your business and delight your customers with every interaction.
          </p>

          {/* Decorative Elements */}
          <div className="mt-12 flex justify-center gap-4">
            <div className="w-3 h-3 rounded-full bg-white/30" />
            <div className="w-3 h-3 rounded-full bg-white/50" />
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginForm />
    </GuestGuard>
  );
}
