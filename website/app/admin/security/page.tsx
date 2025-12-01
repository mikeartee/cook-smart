'use client';

import { Shield, AlertTriangle, Lock, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SecurityPage(): React.ReactElement {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Security & Audit</h1>
          <p className="text-muted-foreground">Monitor security events and audit logs</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Audit Log
        </Button>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Login Attempts</p>
              <p className="mt-2 text-3xl font-bold">1,234</p>
              <p className="mt-2 text-sm text-muted-foreground">Last 24h</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed Logins</p>
              <p className="mt-2 text-3xl font-bold">23</p>
              <p className="mt-2 text-sm text-muted-foreground">Last 24h</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Suspicious Activity</p>
              <p className="mt-2 text-3xl font-bold">5</p>
              <p className="mt-2 text-sm text-muted-foreground">Requires review</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <Eye className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Security Score</p>
              <p className="mt-2 text-3xl font-bold">95%</p>
              <p className="mt-2 text-sm text-green-500">Excellent</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Recent Security Events</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 border-b pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Multiple failed login attempts</p>
                <p className="text-sm text-muted-foreground">
                  IP: 192.168.1.100 - 5 attempts in 2 minutes
                </p>
                <p className="mt-1 text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <Badge variant="destructive">High</Badge>
            </div>

            <div className="flex items-start gap-3 border-b pb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Unusual access pattern detected</p>
                <p className="text-sm text-muted-foreground">
                  User accessed admin panel from new location
                </p>
                <p className="mt-1 text-xs text-muted-foreground">5 hours ago</p>
              </div>
              <Badge variant="secondary">Medium</Badge>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Password changed</p>
                <p className="text-sm text-muted-foreground">
                  Admin user updated their password
                </p>
                <p className="mt-1 text-xs text-muted-foreground">1 day ago</p>
              </div>
              <Badge variant="outline">Info</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Audit Log</h2>
          <div className="space-y-3">
            <div className="border-b pb-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">User deactivated</p>
                <p className="text-sm text-muted-foreground">2h ago</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Admin: admin@cooksmartapp.com
              </p>
              <p className="text-sm text-muted-foreground">
                Action: Deactivated user john.doe@example.com
              </p>
            </div>

            <div className="border-b pb-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Content moderated</p>
                <p className="text-sm text-muted-foreground">4h ago</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Admin: admin@cooksmartapp.com
              </p>
              <p className="text-sm text-muted-foreground">
                Action: Removed flagged recipe "Spicy Curry"
              </p>
            </div>

            <div className="border-b pb-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Settings updated</p>
                <p className="text-sm text-muted-foreground">1d ago</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Admin: admin@cooksmartapp.com
              </p>
              <p className="text-sm text-muted-foreground">
                Action: Changed session timeout to 30 minutes
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="font-medium">Admin access granted</p>
                <p className="text-sm text-muted-foreground">2d ago</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Admin: admin@cooksmartapp.com
              </p>
              <p className="text-sm text-muted-foreground">
                Action: Granted admin access to jane.smith@example.com
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
