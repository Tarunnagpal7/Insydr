"use client";

import Link from "next/link";
import Logo from "@/src/components/ui/Logo";

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const SearchIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
    <path d="M11 8v2" />
    <path d="M11 14h.01" />
  </svg>
);

export default function NotFound() {
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
        <div className="flex justify-center mb-10">
          <Logo size="lg" />
        </div>

        {/* 404 Graphic */}
        <div className="relative mb-8 flex justify-center items-center">
          <div className="absolute w-24 h-24 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          <h1 className="text-[6rem] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 leading-none drop-shadow-md relative z-10">
            404
          </h1>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-zinc-800/80 text-red-500 flex items-center justify-center shadow-lg border border-white/10 z-20">
            <SearchIcon />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Page not found
        </h2>
        <p className="text-zinc-400 text-sm mb-8">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Action Button */}
        <Link
          href="/"
          className="w-full relative group overflow-hidden rounded-xl inline-flex"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transition-transform duration-300 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[url('/noise.png')] mix-blend-overlay transition-opacity duration-300" />
          <div className="absolute -inset-1 bg-red-400/30 blur-xl group-hover:bg-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="w-full relative flex items-center justify-center gap-2 px-6 py-3.5 text-white font-medium shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <HomeIcon />
            <span>Return to Home</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
