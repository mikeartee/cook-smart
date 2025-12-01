import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export function RecipeCardSkeleton(): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Skeleton className="aspect-4/3 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

export function BlogCardSkeleton(): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton(): React.ReactElement {
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-8 w-8" />
      </td>
    </tr>
  );
}
