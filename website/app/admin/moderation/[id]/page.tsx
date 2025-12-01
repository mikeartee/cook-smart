'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, Calendar, Flag } from 'lucide-react';
import Link from 'next/link';
import { moderationApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContentDetail {
  id: string;
  type: 'recipe' | 'comment' | 'review';
  title: string;
  content: string;
  fullContent?: string;
  author: {
    id: string;
    name: string;
    email: string;
    joinDate: Date;
    totalContent: number;
    flaggedContent: number;
  };
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  flagReason: string;
  flagDetails: string;
  flaggedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  history: Array<{
    action: string;
    moderator: string;
    timestamp: Date;
    notes?: string;
  }>;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ContentReviewPage({ params }: PageProps): React.ReactElement {
  const { id } = React.use(params);
  const router = useRouter();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotes, setActionNotes] = useState('');
  const [removalReason, setRemovalReason] = useState('');
  const [showRemovalForm, setShowRemovalForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await moderationApi.getDetail(id);
      setContent(response as ContentDetail);
    } catch (error) {
      console.error('Failed to fetch content details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (): Promise<void> => {
    if (!content) return;

    if (!confirm('Are you sure you want to approve this content? This will make it visible to all users.')) {
      return;
    }

    try {
      setIsProcessing(true);
      await moderationApi.approve(content.id, {
        notes: actionNotes,
        notifyCreator: true,
      });
      
      alert('Content approved successfully. The creator has been notified.');
      router.push('/admin/moderation');
    } catch (error) {
      console.error('Failed to approve content:', error);
      alert('Failed to approve content. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!content || !removalReason.trim()) {
      alert('Please provide a reason for removal.');
      return;
    }

    if (!confirm('Are you sure you want to remove this content? This action cannot be undone.')) {
      return;
    }

    try {
      setIsProcessing(true);
      await moderationApi.remove(content.id, {
        reason: removalReason,
        notes: actionNotes,
        notifyCreator: true,
      });
      
      alert('Content removed successfully. The creator has been notified.');
      router.push('/admin/moderation');
    } catch (error) {
      console.error('Failed to remove content:', error);
      alert('Failed to remove content. Please try again.');
    } finally {
      setIsProcessing(false);
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

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center">
        <AlertTriangle className="mb-4 h-16 w-16 text-yellow-500" />
        <h2 className="mb-2 text-2xl font-bold">Content Not Found</h2>
        <p className="mb-4 text-muted-foreground">The requested content could not be found.</p>
        <Button asChild>
          <Link href="/admin/moderation">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Queue
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/moderation">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Queue
          </Link>
        </Button>
        <h1 className="mb-2 text-3xl font-bold">Content Review</h1>
        <p className="text-muted-foreground">Review flagged content and take action</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-6 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="outline">{content.type}</Badge>
              <Badge variant={getPriorityColor(content.priority) as any}>
                {content.priority} priority
              </Badge>
            </div>

            <h2 className="mb-4 text-2xl font-bold">{content.title}</h2>

            <div className="mb-6 rounded-lg bg-muted p-4">
              <h3 className="mb-2 font-semibold">Content:</h3>
              <div className="whitespace-pre-wrap text-sm">
                {content.fullContent || content.content}
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <div className="mb-2 flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
                <h3 className="font-semibold text-red-900 dark:text-red-100">Flag Reason</h3>
              </div>
              <p className="mb-2 font-medium text-red-800 dark:text-red-200">{content.flagReason}</p>
              {content.flagDetails && (
                <p className="text-sm text-red-700 dark:text-red-300">{content.flagDetails}</p>
              )}
            </div>

            {content.history && content.history.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Moderation History</h3>
                <div className="space-y-2">
                  {content.history.map((entry, index) => (
                    <div key={index} className="rounded-lg border p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        By: {entry.moderator}
                      </div>
                      {entry.notes && (
                        <div className="mt-2 text-muted-foreground">
                          Notes: {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Moderation Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about your decision..."
                  value={actionNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionNotes(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              {showRemovalForm && (
                <div>
                  <Label htmlFor="removal-reason" className="text-red-600">
                    Removal Reason (Required) *
                  </Label>
                  <Textarea
                    id="removal-reason"
                    placeholder="Explain why this content is being removed. This will be sent to the creator."
                    value={removalReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemovalReason(e.target.value)}
                    rows={4}
                    className="mt-2 border-red-300"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3">
                {!showRemovalForm ? (
                  <>
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isProcessing ? 'Processing...' : 'Approve Content'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRemovalForm(true)}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Remove Content
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRemovalForm(false);
                        setRemovalReason('');
                      }}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRemove}
                      disabled={isProcessing || !removalReason.trim()}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {isProcessing ? 'Removing...' : 'Confirm Removal'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <User className="h-5 w-5" />
              Content Author
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{content.author.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{content.author.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Member Since:</span>
                <p className="font-medium">
                  {new Date(content.author.joinDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Content:</span>
                <p className="font-medium">{content.author.totalContent} items</p>
              </div>
              <div>
                <span className="text-muted-foreground">Flagged Content:</span>
                <p className="font-medium">{content.author.flaggedContent} items</p>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/admin/users/${content.author.id}`}>
                  View User Profile
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Flag className="h-5 w-5" />
              Reporter Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{content.reporter.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{content.reporter.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reported:</span>
                <p className="font-medium">
                  {new Date(content.flaggedAt).toLocaleString()}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href={`/admin/users/${content.reporter.id}`}>
                  View Reporter Profile
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950">
            <h3 className="mb-2 font-semibold text-yellow-900 dark:text-yellow-100">
              Moderation Guidelines
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <li>• Review content objectively</li>
              <li>• Consider context and intent</li>
              <li>• Provide clear reasons for removal</li>
              <li>• All actions are logged for audit</li>
              <li>• Creators are notified of decisions</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

