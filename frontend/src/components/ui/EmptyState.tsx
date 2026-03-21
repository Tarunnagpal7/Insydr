'use client';

import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5 text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">{description}</p>
      
      <div className="flex items-center gap-3">
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-xl hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-900/20"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-xl hover:from-red-500 hover:to-red-600 transition-all shadow-lg shadow-red-900/20"
            >
              {action.label}
            </button>
          )
        )}
        {secondaryAction && (
          secondaryAction.href ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-gray-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-all border border-white/10"
            >
              {secondaryAction.label}
            </Link>
          ) : (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-gray-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-all border border-white/10"
            >
              {secondaryAction.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
