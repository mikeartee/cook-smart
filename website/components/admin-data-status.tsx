'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useRefresh } from '@/contexts/admin-refresh-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdminDataStatusProps {
  pageId: string;
  lastUpdated?: Date | null;
  error?: string | null;
  isLoading?: boolean;
  className?: string;
}

export function AdminDataStatus({
  pageId: _pageId,
  lastUpdated,
  error,
  isLoading,
  className,
}: AdminDataStatusProps): React.ReactElement {
  const { isRefreshing } = useRefresh();

  const getStatusIcon = (): React.ReactElement => {
    if (isLoading || isRefreshing) {
      return <RefreshCw className="h-3 w-3 animate-spin" />;
    }
    if (error) {
      return <AlertCircle className="h-3 w-3" />;
    }
    if (lastUpdated) {
      return <CheckCircle className="h-3 w-3" />;
    }
    return <Clock className="h-3 w-3" />;
  };

  const getStatusText = (): string => {
    if (isLoading || isRefreshing) {
      return 'Refreshing...';
    }
    if (error) {
      return 'Error';
    }
    if (lastUpdated) {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 1) {
        return 'Just updated';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else {
        const diffHours = Math.floor(diffMins / 60);
        return `${diffHours}h ago`;
      }
    }
    return 'Not loaded';
  };

  const getVariant = (): 'default' | 'secondary' | 'destructive' => {
    if (error) return 'destructive';
    if (isLoading || isRefreshing) return 'secondary';
    return 'default';
  };

  return (
    <Badge variant={getVariant()} className={cn('gap-1 text-xs', className)}>
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  );
}

export function AdminPageStatus({
  pageId,
  lastUpdated,
  error,
  isLoading,
}: Omit<AdminDataStatusProps, 'className'>): React.ReactElement {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Data status:</span>
      <AdminDataStatus
        pageId={pageId}
        lastUpdated={lastUpdated}
        error={error}
        isLoading={isLoading}
      />
    </div>
  );
}
