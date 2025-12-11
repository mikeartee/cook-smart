'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RefreshContextType {
  refreshTrigger: number;
  isRefreshing: boolean;
  refreshAll: () => void;
  refreshPage: (pageId: string) => void;
  setRefreshing: (refreshing: boolean) => void;
  pageRefreshTriggers: Record<string, number>;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

interface RefreshProviderProps {
  children: ReactNode;
}

export function RefreshProvider({ children }: RefreshProviderProps): React.ReactElement {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pageRefreshTriggers, setPageRefreshTriggers] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAll = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);

    // Also trigger all page-specific refreshes
    setPageRefreshTriggers((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key] = (updated[key] || 0) + 1;
      });
      return updated;
    });

    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const refreshPage = useCallback((pageId: string) => {
    setPageRefreshTriggers((prev) => ({
      ...prev,
      [pageId]: (prev[pageId] || 0) + 1,
    }));
  }, []);

  const setRefreshing = useCallback((refreshing: boolean) => {
    setIsRefreshing(refreshing);
  }, []);

  const value: RefreshContextType = {
    refreshTrigger,
    isRefreshing,
    refreshAll,
    refreshPage,
    setRefreshing,
    pageRefreshTriggers,
  };

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function useRefresh(): RefreshContextType {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}

export function usePageRefresh(pageId: string): {
  refreshTrigger: number;
  refresh: () => void;
  isRefreshing: boolean;
} {
  const { pageRefreshTriggers, refreshPage, isRefreshing } = useRefresh();

  return {
    refreshTrigger: pageRefreshTriggers[pageId] || 0,
    refresh: () => refreshPage(pageId),
    isRefreshing,
  };
}
