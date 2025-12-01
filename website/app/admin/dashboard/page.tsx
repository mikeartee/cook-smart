'use client';

import { Users, ChefHat, Eye, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps): React.ReactElement {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
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

export default function AdminDashboardPage(): React.ReactElement {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value="12,543"
          change="+12.5%"
          trend="up"
          icon={Users}
        />
        <StatCard
          title="Total Recipes"
          value="8,234"
          change="+8.2%"
          trend="up"
          icon={ChefHat}
        />
        <StatCard
          title="Recipe Views"
          value="145.2K"
          change="+23.1%"
          trend="up"
          icon={Eye}
        />
        <StatCard
          title="App Downloads"
          value="3,421"
          change="-2.4%"
          trend="down"
          icon={Download}
        />
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">New user registered</p>
                <p className="text-sm text-muted-foreground">john.doe@example.com joined</p>
              </div>
              <span className="text-sm text-muted-foreground">2 min ago</span>
            </div>
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ChefHat className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">New recipe published</p>
                <p className="text-sm text-muted-foreground">"Spicy Thai Curry" by Sarah Chen</p>
              </div>
              <span className="text-sm text-muted-foreground">15 min ago</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">App download milestone</p>
                <p className="text-sm text-muted-foreground">Reached 50,000 total downloads</p>
              </div>
              <span className="text-sm text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
