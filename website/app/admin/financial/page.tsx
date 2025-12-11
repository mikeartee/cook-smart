'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, CreditCard, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import apiClient from '@/lib/api-client';

interface FinancialData {
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
}

export default function FinancialPage(): React.ReactElement {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<{ overview: FinancialData }>(
          '/api/v1/admin/analytics/overview'
        );
        setFinancialData({
          revenue: response.overview.revenue,
          subscriptions: response.overview.subscriptions,
        });
      } catch (error) {
        console.error('Failed to fetch financial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">Monitor revenue and subscription metrics</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold">
                {isLoading
                  ? 'Loading...'
                  : formatCurrency(financialData?.revenue.totalRevenue || 0)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Live Data</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
              <p className="mt-2 text-3xl font-bold">
                {isLoading ? 'Loading...' : financialData?.subscriptions.active || 0}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Live Data</span>
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
              <p className="text-sm font-medium text-muted-foreground">MRR</p>
              <p className="mt-2 text-3xl font-bold">
                {isLoading ? 'Loading...' : formatCurrency(financialData?.revenue.mrr || 0)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Live Data</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed Payments</p>
              <p className="mt-2 text-3xl font-bold">12</p>
              <p className="mt-2 text-sm text-muted-foreground">Requires attention</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <CreditCard className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Subscription Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Premium Monthly</p>
                <p className="text-sm text-muted-foreground">$9.99/month</p>
              </div>
              <div className="text-right">
                <p className="font-bold">856</p>
                <p className="text-sm text-muted-foreground">subscribers</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Premium Yearly</p>
                <p className="text-sm text-muted-foreground">$99.99/year</p>
              </div>
              <div className="text-right">
                <p className="font-bold">378</p>
                <p className="text-sm text-muted-foreground">subscribers</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Free Tier</p>
                <p className="text-sm text-muted-foreground">$0/month</p>
              </div>
              <div className="text-right">
                <p className="font-bold">11,309</p>
                <p className="text-sm text-muted-foreground">users</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Recent Transactions</h2>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Transaction history coming soon</p>
              <p className="text-xs mt-1">Payment integration in development</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
