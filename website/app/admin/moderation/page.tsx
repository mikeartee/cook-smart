'use client';

import { useState, useEffect } from 'react';
import { Flag, CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import Link from 'next/link';
import { moderationApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FlaggedItem {
  id: string;
  type: 'recipe' | 'comment' | 'review';
  title: string;
  content: string;
  author: string;
  flagReason: string;
  reporter: string;
  flaggedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function ModerationPage(): React.ReactElement {
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    fetchQueue();
  }, [typeFilter, priorityFilter]);

  const fetchQueue = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const response = await moderationApi.getQueue(params);
      setItems(response.items as FlaggedItem[]);
    } catch (error) {
      console.error('Failed to fetch moderation queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string): Promise<void> => {
    try {
      await moderationApi.approve(id);
      fetchQueue();
    } catch (error) {
      console.error('Failed to approve content:', error);
    }
  };

  const handleRemove = async (id: string): Promise<void> => {
    const reason = prompt('Please provide a reason for removal:');
    if (!reason) return;

    try {
      await moderationApi.remove(id, { reason });
      fetchQueue();
    } catch (error) {
      console.error('Failed to remove content:', error);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground">Review and moderate flagged content</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex gap-2">
          <span className="text-sm font-medium leading-9">Type:</span>
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={typeFilter === 'recipe' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('recipe')}
            size="sm"
          >
            Recipes
          </Button>
          <Button
            variant={typeFilter === 'comment' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('comment')}
            size="sm"
          >
            Comments
          </Button>
          <Button
            variant={typeFilter === 'review' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('review')}
            size="sm"
          >
            Reviews
          </Button>
        </div>

        <div className="flex gap-2">
          <span className="text-sm font-medium leading-9">Priority:</span>
          <Button
            variant={priorityFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setPriorityFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={priorityFilter === 'urgent' ? 'default' : 'outline'}
            onClick={() => setPriorityFilter('urgent')}
            size="sm"
          >
            Urgent
          </Button>
          <Button
            variant={priorityFilter === 'high' ? 'default' : 'outline'}
            onClick={() => setPriorityFilter('high')}
            size="sm"
          >
            High
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h3 className="mb-2 text-xl font-semibold">All Clear!</h3>
          <p className="text-muted-foreground">No flagged content in the moderation queue</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge variant={getPriorityColor(item.priority) as any}>
                      {item.priority}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Flagged {new Date(item.flaggedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                    {item.content}
                  </p>

                  <div className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground">Author:</span>{' '}
                      <span className="font-medium">{item.author}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reporter:</span>{' '}
                      <span className="font-medium">{item.reporter}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reason:</span>{' '}
                      <span className="font-medium">{item.flagReason}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/moderation/${item.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(item.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(item.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
