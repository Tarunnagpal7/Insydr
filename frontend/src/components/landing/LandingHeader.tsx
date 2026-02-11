'use client';

import Link from 'next/link';
import Logo from '@/src/components/ui/Logo';

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Logo size="md" variant="light" href="/" />
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</Link>
          <Link href="/use-cases" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Use Cases</Link>
          <Link href="/pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Pricing</Link>
          <a href="https://docs.insydr.ai" target="_blank" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Docs</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-all"
          >
            Start Converting
          </Link>
        </div>
      </div>
    </header>
  );
}
