'use client';

import { useState } from 'react';
import { Send, Users, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function NotificationsPage(): React.ReactElement {
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    scheduledAt: '',
  });

  const handleSend = async (): Promise<void> => {
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSending(false);
    setNotification({ title: '', message: '', targetAudience: 'all', scheduledAt: '' });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Send push notifications to app users</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-6 text-xl font-semibold">Create Notification</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={notification.title}
                  onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                  placeholder="Notification title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <textarea
                  id="message"
                  value={notification.message}
                  onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                  placeholder="Notification message"
                  rows={4}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <select
                  id="audience"
                  value={notification.targetAudience}
                  onChange={(e) =>
                    setNotification({ ...notification, targetAudience: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Users</option>
                  <option value="inactive">Inactive Users</option>
                  <option value="premium">Premium Members</option>
                </select>
              </div>

              <div>
                <Label htmlFor="schedule">Schedule (Optional)</Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={notification.scheduledAt}
                  onChange={(e) =>
                    setNotification({ ...notification, scheduledAt: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Leave empty to send immediately
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSend} disabled={isSending || !notification.title || !notification.message}>
                  {isSending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {notification.scheduledAt ? 'Schedule' : 'Send Now'}
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Audience Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">All Users</span>
                <span className="font-medium">12,543</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="font-medium">8,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inactive Users</span>
                <span className="font-medium">4,309</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Premium Members</span>
                <span className="font-medium">1,234</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Recent Notifications</h3>
            <div className="space-y-3">
              <div className="border-b pb-3">
                <p className="font-medium">New Recipe Alert</p>
                <p className="text-sm text-muted-foreground">Sent 2 hours ago</p>
                <p className="mt-1 text-xs text-muted-foreground">Delivered: 8,234</p>
              </div>
              <div className="border-b pb-3">
                <p className="font-medium">Weekly Tips</p>
                <p className="text-sm text-muted-foreground">Sent 1 day ago</p>
                <p className="mt-1 text-xs text-muted-foreground">Delivered: 12,543</p>
              </div>
              <div>
                <p className="font-medium">App Update</p>
                <p className="text-sm text-muted-foreground">Sent 3 days ago</p>
                <p className="mt-1 text-xs text-muted-foreground">Delivered: 12,543</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
