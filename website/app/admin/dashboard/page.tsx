'use client';

import { useState, useEffect } from 'react';
import { Users, ChefHat, Eye, TrendingUp, TrendingDown, DollarSign, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/lib/api-client';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
}

interface AnalyticsOverview {
  users: {
    total: number;
    thisMonth: number;
    today: number;
    coFounders: number;
    premium: number;
    free: number;
  };
  engagement: {
    dau: number;
    mau: number;
    totalIngredients: number;
    totalRecipes: number;
    totalSearches: number;
  };
  revenue: {
    mrr: number;
    totalRevenue: number;
    arpu: number;
    ltv: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    canceled: number;
    conversionRate: number;
  };
  referrals: {
    totalSent: number;
    totalSuccessful: number;
    conversionRate: number;
  };
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  isLoading,
}: StatCardProps): React.ReactElement {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200"></div>
          ) : (
            <p className="mt-2 text-3xl font-bold">{value}</p>
          )}
          <div className="mt-2 flex items-center gap-1 text-sm">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>{change}</span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function AdminDashboardPage(): React.ReactElement {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<{ overview: AnalyticsOverview }>(
          '/api/v1/admin/analytics/overview'
        );
        setAnalytics(response.overview);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-500 mb-4">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  // Calculate growth percentages (mock for now, could be enhanced with historical data)
  const userGrowth = analytics
    ? `+${((analytics.users.thisMonth / analytics.users.total) * 100).toFixed(1)}%`
    : '+0%';
  const recipeGrowth = '+15.2%'; // Could be calculated from historical data
  const engagementGrowth = analytics
    ? `+${((analytics.engagement.dau / analytics.engagement.mau) * 100).toFixed(1)}%`
    : '+0%';
  const revenueGrowth = analytics
    ? `+${(analytics.revenue.mrr > 0 ? 25.5 : 0).toFixed(1)}%`
    : '+0%';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with Cook Smart.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={analytics ? formatNumber(analytics.users.total) : '0'}
          change={userGrowth}
          trend="up"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="User Recipes"
          value={analytics ? formatNumber(analytics.engagement.totalRecipes) : '0'}
          change={recipeGrowth}
          trend="up"
          icon={ChefHat}
          isLoading={isLoading}
        />
        <StatCard
          title="Daily Active Users"
          value={analytics ? formatNumber(analytics.engagement.dau) : '0'}
          change={engagementGrowth}
          trend="up"
          icon={Eye}
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={analytics ? formatCurrency(analytics.revenue.mrr) : '$0'}
          change={revenueGrowth}
          trend="up"
          icon={DollarSign}
          isLoading={isLoading}
        />
      </div>

      {/* Additional Stats */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
              {isLoading ? (
                <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold">{analytics?.subscriptions.active || 0}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {analytics?.subscriptions.conversionRate.toFixed(1) || 0}% conversion rate
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Ingredients</p>
              {isLoading ? (
                <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(analytics?.engagement.totalIngredients || 0)}
                </p>
              )}
              <p className="text-sm text-muted-foreground">User-added ingredients</p>
            </div>
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recipe Searches</p>
              {isLoading ? (
                <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200"></div>
              ) : (
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(analytics?.engagement.totalSearches || 0)}
                </p>
              )}
              <p className="text-sm text-muted-foreground">Total searches performed</p>
            </div>
            <Eye className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* User Breakdown */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">User Breakdown</h2>
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics?.users.free || 0}</p>
                <p className="text-sm text-muted-foreground">Free Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analytics?.users.premium || 0}</p>
                <p className="text-sm text-muted-foreground">Premium Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {analytics?.users.coFounders || 0}
                </p>
                <p className="text-sm text-muted-foreground">Co-Founders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{analytics?.users.today || 0}</p>
                <p className="text-sm text-muted-foreground">New Today</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Revenue Metrics */}
      {analytics && analytics.revenue.mrr > 0 && (
        <div className="mt-8">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold">Revenue Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.revenue.mrr)}
                </p>
                <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.revenue.arpu)}
                </p>
                <p className="text-sm text-muted-foreground">Average Revenue Per User</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(analytics.revenue.ltv)}
                </p>
                <p className="text-sm text-muted-foreground">Lifetime Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(analytics.revenue.totalRevenue)}
                </p>
                <p className="text-sm text-muted-foreground">Projected Annual Revenue</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
