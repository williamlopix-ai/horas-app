

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-2 ${className}`}></div>
  )
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-4 rounded-ctl ${className}`} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface-2 border border-hair rounded-card p-6 flex flex-col gap-lg shadow-e1 ${className}`}>
      <div className="flex justify-between items-start gap-lg">
        <div className="space-y-2 w-full">
          <SkeletonLine className="w-16 h-3" />
          <SkeletonLine className="w-3/4 h-5" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-lg py-2 border-y border-hair mt-2">
        <div>
          <SkeletonLine className="w-12 h-3 mb-2" />
          <SkeletonLine className="w-full h-6" />
        </div>
        <div>
          <SkeletonLine className="w-12 h-3 mb-2" />
          <SkeletonLine className="w-full h-6" />
        </div>
        <div>
          <SkeletonLine className="w-12 h-3 mb-2" />
          <SkeletonLine className="w-full h-6" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <SkeletonLine className="w-16 h-3" />
          <SkeletonLine className="w-16 h-3" />
        </div>
        <Skeleton className="w-full h-3 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-between py-4 px-6 border-b border-hair last:border-0 ${className}`}>
      <div className="flex items-center gap-md w-1/3">
        <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
        <SkeletonLine className="w-full" />
      </div>
      <div className="w-1/4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-sm justify-end w-1/4">
        <Skeleton className="h-8 w-16 rounded-ctl" />
        <Skeleton className="h-8 w-20 rounded-ctl" />
        <Skeleton className="h-8 w-16 rounded-ctl" />
      </div>
    </div>
  )
}
