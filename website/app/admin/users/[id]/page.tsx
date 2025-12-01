'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Clock, ChefHat, Activity } from 'lucide-react';
import Link from 'next/link';
import { usersApi } from '@/lib/api-client';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import React from 'react';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: UserDetailPageProps): React.ReactElement {
  const { id } = React.use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const userData = await usersApi.getById(id);
      setUser(userData as User);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">User Not Found</h1>
        <Button onClick={() => router.push('/admin/users')}>Back to Users</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Details</h1>
          <Button asChild>
            <Link href={`/admin/users/${user.id}/edit`}>Edit User</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Last login {new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Activity History</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 border-b pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ChefHat className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Created recipe</p>
                  <p className="text-sm text-muted-foreground">"Spicy Thai Curry"</p>
                  <p className="mt-1 text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-b pb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Logged in</p>
                  <p className="text-sm text-muted-foreground">From mobile app</p>
                  <p className="mt-1 text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ChefHat className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Saved recipe</p>
                  <p className="text-sm text-muted-foreground">"Classic Lasagna"</p>
                  <p className="mt-1 text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Statistics</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Recipes Created</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recipes Saved</p>
                <p className="text-2xl font-bold">45</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meal Plans</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Verified</span>
                <Badge variant="default">Yes</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Premium Member</span>
                <Badge variant="secondary">No</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Status</span>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
