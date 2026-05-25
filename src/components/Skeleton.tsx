

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#1E2530] ${className}`}></div>
  )
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-4 rounded-md ${className}`} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-[#161B22] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 ${className}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 w-full">
          <SkeletonLine className="w-16 h-3" />
          <SkeletonLine className="w-3/4 h-5" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-4 py-2 border-y border-gray-800/60 mt-2">
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
    <div className={`flex items-center justify-between py-4 px-6 border-b border-gray-800/50 last:border-0 ${className}`}>
      <div className="flex items-center gap-3 w-1/3">
        <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
        <SkeletonLine className="w-full" />
      </div>
      <div className="w-1/4">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-2 justify-end w-1/4">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  )
}
