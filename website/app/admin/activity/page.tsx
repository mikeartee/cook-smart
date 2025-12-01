'use client';

import { useState, useEffect } from 'react';
import { Users, Eye, Heart, Share2, TrendingUp, Activity } from 'lucide-react';
import { analyticsApi } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ActiveSession {
  userId: string;
  username: string;
  currentPage: string;
  duration: number;
  lastActivity: Date;
}

interface EngagementMetrics {
  totalViews: number;
  totalSaves: number;
  totalShares: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface CohortData {
  week: string;
  newUsers: number;
  retained: number;
  retentionRate: number;
}

export default function ActivityMonitorPage(): React.ReactElement {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchActivityData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchActivityData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchActivityData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response: any = await analyticsApi.getMetric('activity');
      setActiveSessions(response.activeSessions || []);
      setEngagement(response.engagement || null);
      setCohorts(response.cohorts || []);
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (isLoading && activeSessions.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">User Activity Monitor</h1>
          <p className="text-muted-foreground">Real-time user engagement and behavior analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? 'default' : 'outline'}>
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {engagement && (
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="mt-2 text-2xl font-bold">{engagement.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-primary/50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Saves</p>
                <p className="mt-2 text-2xl font-bold">{engagement.totalSaves.toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-primary/50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
                <p className="mt-2 text-2xl font-bold">{engagement.totalShares.toLocaleString()}</p>
              </div>
              <Share2 className="h-8 w-8 text-primary/50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatDuration(engagement.avgSessionDuration)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary/50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                <p className="mt-2 text-2xl font-bold">{engagement.bounceRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>
          </Card>
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Active Sessions</h2>
            <Badge>{activeSessions.length} online</Badge>
          </div>

          {activeSessions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No active sessions at the moment
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.slice(0, 10).map((session) => (
                <div key={session.userId} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {session.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{session.username}</p>
                      <p className="text-xs text-muted-foreground">{session.currentPage}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatDuration(session.duration)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.lastActivity).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Cohort Retention Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Week</th>
                  <th className="pb-2 text-right font-medium">New Users</th>
                  <th className="pb-2 text-right font-medium">Retained</th>
                  <th className="pb-2 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No cohort data available
                    </td>
                  </tr>
                ) : (
                  cohorts.map((cohort) => (
                    <tr key={cohort.week} className="border-b">
                      <td className="py-2">{cohort.week}</td>
                      <td className="py-2 text-right">{cohort.newUsers}</td>
                      <td className="py-2 text-right">{cohort.retained}</td>
                      <td className="py-2 text-right">
                        <Badge
                          variant={cohort.retentionRate >= 50 ? 'default' : 'secondary'}
                        >
                          {cohort.retentionRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold">Engagement Trends</h2>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Chart visualization - integrate with charting library for detailed trends
        </div>
      </Card>
    </div>
  );
}

