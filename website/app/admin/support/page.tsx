'use client';

import { useState, useEffect } from 'react';
import { Search, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import apiClient from '@/lib/api-client';

interface Feedback {
  id: string;
  message: string;
  user_email: string;
  status: string;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  user: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  assignedTo: string | null;
}

export default function SupportPage(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<{ feedback: Feedback[] }>('/api/v1/admin/feedback');
        setFeedback(response.feedback || []);
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  // Convert feedback to ticket format for display
  const tickets: Ticket[] = feedback.map((item) => ({
    id: item.id,
    subject: item.message.substring(0, 50) + (item.message.length > 50 ? '...' : ''),
    user: item.user_email || 'Anonymous',
    status: 'open' as const,
    priority: 'medium' as const,
    createdAt: new Date(item.created_at),
    assignedTo: null,
  }));

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (search && !ticket.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTimeAgo = (date: Date): string => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground">Manage and respond to user support requests</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Open Tickets</p>
          <p className="mt-1 text-2xl font-bold">
            {tickets.filter((t) => t.status === 'open').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="mt-1 text-2xl font-bold">
            {tickets.filter((t) => t.status === 'in_progress').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="mt-1 text-2xl font-bold">
            {tickets.filter((t) => t.status === 'resolved').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Response Time</p>
          <p className="mt-1 text-2xl font-bold">2.5h</p>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('open')}
            size="sm"
          >
            Open
          </Button>
          <Button
            variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('in_progress')}
            size="sm"
          >
            In Progress
          </Button>
          <Button
            variant={statusFilter === 'resolved' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('resolved')}
            size="sm"
          >
            Resolved
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="p-4 transition-shadow hover:shadow-md">
            <Link href={`/admin/support/${ticket.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <h3 className="font-semibold">{ticket.subject}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>{ticket.user}</span>
                    <span>•</span>
                    <span>{getTimeAgo(ticket.createdAt)}</span>
                    {ticket.assignedTo && (
                      <>
                        <span>•</span>
                        <span>Assigned to {ticket.assignedTo}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Badge variant={getPriorityColor(ticket.priority) as any}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant="outline">{ticket.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            </Link>
          </Card>
        ))}

        {filteredTickets.length === 0 && (
          <Card className="p-12 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No tickets found</p>
          </Card>
        )}
      </div>
    </div>
  );
}
