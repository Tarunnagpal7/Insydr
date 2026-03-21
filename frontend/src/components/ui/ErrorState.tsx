'use client';

import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 border border-red-500/20 rounded-2xl bg-red-500/[0.03] ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
        <ExclamationTriangleIcon className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-6">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white text-sm font-medium rounded-xl hover:bg-white/10 transition-all border border-white/10"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
