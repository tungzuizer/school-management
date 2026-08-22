import { Skeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Top Banner Skeleton */}
      <div className="bg-white/80 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-2xl" />
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
      </div>

      {/* Grid Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main Table / Card Grid Skeleton */}
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
