'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRefresh } from '@/contexts/admin-refresh-context';
import { cn } from '@/lib/utils';

interface AdminRefreshButtonProps {
  pageId?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  children?: React.ReactNode;
}

export function AdminRefreshButton({
  pageId,
  size = 'default',
  variant = 'outline',
  className,
  children,
}: AdminRefreshButtonProps): React.ReactElement {
  const { refreshAll, refreshPage, isRefreshing } = useRefresh();

  const handleRefresh = (): void => {
    if (pageId) {
      refreshPage(pageId);
    } else {
      refreshAll();
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      size={size}
      variant={variant}
      className={cn('gap-2', className)}
    >
      <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
      {children || (pageId ? 'Refresh Page' : 'Refresh All')}
    </Button>
  );
}

export function AdminGlobalRefreshButton(): React.ReactElement {
  const { refreshAll, isRefreshing } = useRefresh();

  return (
    <Button
      onClick={refreshAll}
      disabled={isRefreshing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
      {isRefreshing ? 'Refreshing...' : 'Refresh All Data'}
    </Button>
  );
}
