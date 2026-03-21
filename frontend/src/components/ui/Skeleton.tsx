'use client';

import classNames from 'classnames';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({ 
  className = '', 
  variant = 'text', 
  width, 
  height, 
  count = 1 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-white/[0.08]';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={classNames(baseClasses, variantClasses[variant], className)}
          style={{ width, height }}
        />
      ))}
    </>
  );
}

// Pre-built skeleton patterns
export function StatCardSkeleton() {
  return (
    <div className="bg-zinc-900/80 border border-white/[0.08] rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height={12} variant="rounded" />
          <Skeleton width="40%" height={28} variant="rounded" />
        </div>
        <Skeleton variant="rounded" width={40} height={40} />
      </div>
      <Skeleton width="30%" height={14} variant="rounded" />
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton variant="rounded" width={48} height={48} />
        <Skeleton variant="rounded" width={60} height={24} />
      </div>
      <Skeleton width="70%" height={20} variant="rounded" />
      <Skeleton width="50%" height={14} variant="rounded" />
      <div className="space-y-1">
        <Skeleton height={14} variant="rounded" />
        <Skeleton width="80%" height={14} variant="rounded" />
      </div>
      <div className="flex gap-3 pt-3 border-t border-white/5">
        <Skeleton width={60} height={14} variant="rounded" />
        <Skeleton width={60} height={14} variant="rounded" />
      </div>
    </div>
  );
}

export function DocumentRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton variant="rounded" width={36} height={36} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} variant="rounded" />
          <Skeleton width="40%" height={12} variant="rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={32} height={32} />
        <Skeleton variant="rounded" width={32} height={32} />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1">
          <Skeleton height={16} variant="rounded" width={i === 0 ? '80%' : '60%'} />
        </div>
      ))}
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-2">
            <Skeleton width="80%" height={14} variant="rounded" />
            <Skeleton width="30%" height={12} variant="rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="flex items-end gap-1 h-full px-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/[0.05] rounded-t"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}
