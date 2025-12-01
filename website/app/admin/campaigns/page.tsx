'use client';

import { useState } from 'react';
import { Mail, Send, Calendar, Users, Eye, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent';
  targetSegment: string;
  scheduledAt: Date | null;
  sentAt: Date | null;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Weekly Recipe Roundup',
    subject: 'Top 10 Recipes This Week',
    status: 'sent',
    targetSegment: 'All Users',
    scheduledAt: null,
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    metrics: { sent: 12543, opened: 6271, clicked: 1254 },
  },
  {
    id: '2',
    name: 'Premium Feature Announcement',
    subject: 'Introducing Advanced Meal Planning',
    status: 'scheduled',
    targetSegment: 'Active Users',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    sentAt: null,
    metrics: { sent: 0, opened: 0, clicked: 0 },
  },
  {
    id: '3',
    name: 'Re-engagement Campaign',
    subject: 'We Miss You! Come Back for New Recipes',
    status: 'draft',
    targetSegment: 'Inactive Users',
    scheduledAt: null,
    sentAt: null,
    metrics: { sent: 0, opened: 0, clicked: 0 },
  },
];

export default function CampaignsPage(): React.ReactElement {
  const [campaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'scheduled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">Create and manage email marketing campaigns</p>
        </div>
        <Button>
          <Mail className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Campaigns</p>
          <p className="mt-1 text-2xl font-bold">{campaigns.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Sent This Month</p>
          <p className="mt-1 text-2xl font-bold">
            {campaigns.filter((c) => c.status === 'sent').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Open Rate</p>
          <p className="mt-1 text-2xl font-bold">50%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Click Rate</p>
          <p className="mt-1 text-2xl font-bold">10%</p>
        </Card>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{campaign.name}</h3>
                  <Badge variant={getStatusColor(campaign.status) as any}>
                    {campaign.status}
                  </Badge>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{campaign.subject}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{campaign.targetSegment}</span>
                  </div>
                  {campaign.scheduledAt && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Scheduled for {campaign.scheduledAt.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {campaign.sentAt && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Send className="h-4 w-4" />
                      <span>Sent {campaign.sentAt.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {campaign.status === 'sent' && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p className="text-xl font-bold">{campaign.metrics.sent.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Opened</p>
                      <p className="text-xl font-bold">
                        {campaign.metrics.opened.toLocaleString()}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({Math.round((campaign.metrics.opened / campaign.metrics.sent) * 100)}%)
                        </span>
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Clicked</p>
                      <p className="text-xl font-bold">
                        {campaign.metrics.clicked.toLocaleString()}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({Math.round((campaign.metrics.clicked / campaign.metrics.sent) * 100)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/campaigns/${campaign.id}`}>
                    {campaign.status === 'sent' ? (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Stats
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </>
                    )}
                  </Link>
                </Button>
                {campaign.status === 'draft' && (
                  <Button size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
