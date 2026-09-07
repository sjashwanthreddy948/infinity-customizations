import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800 ${className}`}
        />
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full space-y-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
      <div className="flex gap-4 border-b border-slate-100 pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded-lg flex-1 animate-pulse" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2.5 items-center">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className={`h-3.5 bg-slate-100 rounded-md flex-1 animate-pulse ${
                c === 0 ? 'w-16' : c === columns - 1 ? 'w-20' : ''
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card animate-pulse space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-6 w-28 bg-slate-300 rounded" />
          <div className="h-2.5 w-16 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
};
