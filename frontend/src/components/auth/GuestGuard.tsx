"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/src/store/hooks';
import Loading from '@/src/components/ui/Loading';

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * GuestGuard - Protects routes that should only be accessible to guests (non-authenticated users).
 * Redirects to /dashboard if user is already authenticated.
 */
export default function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Show loading state while checking auth
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading />
      </div>
    );
  }

  // Don't render children if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
