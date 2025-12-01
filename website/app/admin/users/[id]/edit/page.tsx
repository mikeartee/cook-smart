'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { usersApi } from '@/lib/api-client';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import React from 'react';

interface UserEditPageProps {
  params: Promise<{ id: string }>;
}

export default function UserEditPage({ params }: UserEditPageProps): React.ReactElement {
  const { id } = React.use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin' | 'super_admin',
    isActive: true,
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const userData = await usersApi.getById(id);
      const u = userData as User;
      setUser(u);
      setFormData({
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await usersApi.update(id, formData);
      router.push(`/admin/users/${id}`);
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setIsSaving(false);
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
          href={`/admin/users/${id}`}
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to User Details
        </Link>
        <h1 className="text-3xl font-bold">Edit User</h1>
      </div>

      <Card className="max-w-2xl p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Account Status</p>
              <p className="text-sm text-muted-foreground">
                {formData.isActive ? 'Account is active' : 'Account is deactivated'}
              </p>
            </div>
            <Button
              variant={formData.isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            >
              {formData.isActive ? 'Active' : 'Inactive'}
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/users/${id}`)}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
