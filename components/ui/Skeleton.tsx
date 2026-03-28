'use client';

import { cn } from '@/lib/utils/clinic';

interface SkeletonProps {
  className?: string;
}

/** A single skeleton bar with pulse animation. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-lg bg-slate-200 animate-pulse', className)}
      aria-hidden="true"
    />
  );
}

/** Skeleton that mimics a full-page card layout (e.g. brand profile, settings). */
export function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-label="読み込み中">
      <div className="h-6 w-40 bg-slate-200 rounded-lg" />
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for a Suspense fallback wrapping a page section. */
export function SuspenseSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse" aria-label="読み込み中">
      <div className="h-5 w-48 bg-slate-200 rounded-lg" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the content-map loading state with a spinner replacement. */
export function TableSkeleton() {
  return (
    <div className="space-y-2 py-6 animate-pulse" aria-label="読み込み中">
      <div className="h-8 bg-slate-100 rounded-lg w-full" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-slate-50 rounded-lg w-full" />
      ))}
    </div>
  );
}
