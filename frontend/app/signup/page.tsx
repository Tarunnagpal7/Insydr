"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, getErrorMessage } from "@/src/lib/auth";
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

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
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

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
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
      await authApi.signup(formData.email, formData.password, formData.full_name);
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-milano-800 to-milano-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        <div className="max-w-lg text-center text-white relative z-10">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20 shadow-xl">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">
            Join Thousands of Businesses
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Start building intelligent AI chatbots in minutes. No coding required, just your knowledge.
          </p>

          {/* Decorative Elements */}
          <div className="mt-12 flex justify-center gap-4">
            <div className="w-3 h-3 rounded-full bg-white" />
            <div className="w-3 h-3 rounded-full bg-white/50" />
            <div className="w-3 h-3 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-10">
            <Logo size="lg" />
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Create your account
            </h1>
            <p className="text-foreground-secondary text-lg">
              Start your free trial. No credit card required.
            </p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <UserIcon />
                </div>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                Password
              </label>
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

              {/* Password Strength */}
              {formData.password && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${passwordChecks.minLength ? 'bg-success text-white' : 'bg-border'}`}>
                      {passwordChecks.minLength && <CheckIcon />}
                    </div>
                    <span className={passwordChecks.minLength ? 'text-success font-medium' : 'text-foreground-muted'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${passwordChecks.hasNumber ? 'bg-success text-white' : 'bg-border'}`}>
                      {passwordChecks.hasNumber && <CheckIcon />}
                    </div>
                    <span className={passwordChecks.hasNumber ? 'text-success font-medium' : 'text-foreground-muted'}>
                      Contains a number
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-semibold text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-4 transition-all font-medium ${
                    formData.confirm_password && formData.password !== formData.confirm_password 
                      ? 'border-error focus:border-error focus:ring-error/10' 
                      : 'border-border focus:border-primary focus:ring-primary/10'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {formData.confirm_password && formData.password !== formData.confirm_password && (
                <p className="text-error text-sm mt-2 flex items-center gap-1 font-medium animate-fade-in">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-foreground-secondary mt-8 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover font-bold hover:underline underline-offset-2 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <GuestGuard>
      <SignupForm />
    </GuestGuard>
  );
}
