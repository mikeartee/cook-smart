'use client';

import { useState, useEffect } from 'react';
import { Users, Eye, Download, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { analyticsApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminRefreshButton } from '@/components/admin-refresh-button';
import { usePageRefresh } from '@/contexts/admin-refresh-context';
import { useToast } from '@/hooks/use-toast';

interface MetricData {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface AnalyticsData {
  activeUsers: MetricData;
  newRegistrations: MetricData;
  recipeViews: MetricData;
  appDownloads: MetricData;
}

export default function AnalyticsPage(): React.ReactElement {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { refreshTrigger } = usePageRefresh('analytics');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, refreshTrigger]);

  const fetchAnalytics = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching analytics data...');
      const response = await analyticsApi.getOverview({
        startDate: getStartDate(dateRange),
        endDate: new Date().toISOString(),
      });

      setData(response as AnalyticsData);
      setLastUpdated(new Date());

      toast({
        title: 'Analytics Updated',
        description: 'Analytics data has been refreshed successfully.',
      });
    } catch (fetchError) {
      console.error('Failed to fetch analytics:', fetchError);
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : 'Failed to load analytics data';
      setError(errorMessage);

      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStartDate = (range: string): string => {
    const now = new Date();
    const days = parseInt(range.replace('d', ''));
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  };

  const handleExport = async (format: 'csv' | 'pdf'): Promise<void> => {
    try {
      const blob = await analyticsApi.export(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export analytics:', err);
    }
  };

  if (error) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Monitor app usage and engagement metrics</p>
          </div>
          <AdminRefreshButton pageId="analytics" />
        </div>

        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold">Failed to Load Analytics</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <AdminRefreshButton pageId="analytics" variant="default">
              Try Again
            </AdminRefreshButton>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Monitor app usage and engagement metrics</p>
          </div>
          <AdminRefreshButton pageId="analytics" />
        </div>

        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Monitor app usage and engagement metrics</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <AdminRefreshButton pageId="analytics" />
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          variant={dateRange === '7d' ? 'default' : 'outline'}
          onClick={() => setDateRange('7d')}
          size="sm"
        >
          Last 7 Days
        </Button>
        <Button
          variant={dateRange === '30d' ? 'default' : 'outline'}
          onClick={() => setDateRange('30d')}
          size="sm"
        >
          Last 30 Days
        </Button>
        <Button
          variant={dateRange === '90d' ? 'default' : 'outline'}
          onClick={() => setDateRange('90d')}
          size="sm"
        >
          Last 90 Days
        </Button>
      </div>

      {data && (
        <>
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="mt-2 text-3xl font-bold">
                    {data.activeUsers.value.toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    {data.activeUsers.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        data.activeUsers.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }
                    >
                      {data.activeUsers.change > 0 ? '+' : ''}
                      {data.activeUsers.change}%
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">New Registrations</p>
                  <p className="mt-2 text-3xl font-bold">
                    {data.newRegistrations.value.toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    {data.newRegistrations.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        data.newRegistrations.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }
                    >
                      {data.newRegistrations.change > 0 ? '+' : ''}
                      {data.newRegistrations.change}%
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recipe Views</p>
                  <p className="mt-2 text-3xl font-bold">
                    {data.recipeViews.value.toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    {data.recipeViews.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        data.recipeViews.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }
                    >
                      {data.recipeViews.change > 0 ? '+' : ''}
                      {data.recipeViews.change}%
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">App Downloads</p>
                  <p className="mt-2 text-3xl font-bold">
                    {data.appDownloads.value.toLocaleString()}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-sm">
                    {data.appDownloads.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        data.appDownloads.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }
                    >
                      {data.appDownloads.change > 0 ? '+' : ''}
                      {data.appDownloads.change}%
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Download className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-bold">Top Recipes</h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">{i}</span>
                      <div>
                        <p className="font-medium">Recipe Title {i}</p>
                        <p className="text-sm text-muted-foreground">by Author Name</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {(1000 - i * 100).toLocaleString()} views
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-bold">User Growth</h2>
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Chart placeholder - integrate with charting library
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
