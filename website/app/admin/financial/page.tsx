'use client';

import { DollarSign, TrendingUp, Users, CreditCard, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FinancialPage(): React.ReactElement {
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
              <p className="mt-2 text-3xl font-bold">$24,543</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span>+12.5%</span>
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
              <p className="mt-2 text-3xl font-bold">1,234</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span>+8.2%</span>
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
              <p className="mt-2 text-3xl font-bold">$8,234</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="h-4 w-4" />
                <span>+15.3%</span>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">john.doe@example.com</p>
                <p className="text-sm text-muted-foreground">Premium Monthly</p>
              </div>
              <div className="text-right">
                <p className="font-bold">$9.99</p>
                <Badge variant="default">Success</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">jane.smith@example.com</p>
                <p className="text-sm text-muted-foreground">Premium Yearly</p>
              </div>
              <div className="text-right">
                <p className="font-bold">$99.99</p>
                <Badge variant="default">Success</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">bob.wilson@example.com</p>
                <p className="text-sm text-muted-foreground">Premium Monthly</p>
              </div>
              <div className="text-right">
                <p className="font-bold">$9.99</p>
                <Badge variant="destructive">Failed</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
