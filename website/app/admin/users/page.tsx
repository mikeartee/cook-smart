'use client';

import { useState, useEffect } from 'react';
import { Search, MoreVertical, Eye, Edit, Ban, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { usersApi } from '@/lib/api-client';
import { User } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminRefreshButton } from '@/components/admin-refresh-button';
import { usePageRefresh } from '@/contexts/admin-refresh-context';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function UsersPage(): React.ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deactivate' | 'delete' | 'suspend' | 'admin';
    userId: string;
    userName: string;
  } | null>(null);

  const { refreshTrigger } = usePageRefresh('users');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, page, refreshTrigger]);

  const fetchUsers = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      console.log('Fetching users with params:', params);
      const response = await usersApi.getAll(params);
      console.log('Users response:', response);

      setUsers(response.users as User[]);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string): Promise<void> => {
    if (actionLoading) return;

    try {
      setActionLoading(userId);

      switch (action) {
        case 'deactivate':
          await usersApi.deactivate(userId);
          toast({
            title: 'Success',
            description: 'User has been deactivated.',
          });
          break;
        case 'suspend':
          await usersApi.update(userId, { suspended: true });
          toast({
            title: 'Success',
            description: 'User has been suspended.',
          });
          break;
        case 'admin':
          await usersApi.update(userId, { isAdmin: true });
          toast({
            title: 'Success',
            description: 'Admin access granted to user.',
          });
          break;
        case 'delete':
          await usersApi.delete(userId);
          toast({
            title: 'Success',
            description: 'User has been deleted.',
          });
          break;
      }

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} user. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage and monitor user accounts</p>
        </div>
        <AdminRefreshButton pageId="users" />
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email..."
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
            All ({total})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
            size="sm"
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('inactive')}
            size="sm"
          >
            Inactive
          </Button>
          <Button
            variant={statusFilter === 'suspended' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('suspended')}
            size="sm"
          >
            Suspended
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Last Login</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          {user.isAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="mr-1 h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{user.role || 'User'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.suspended && (
                          <Badge variant="destructive" className="text-xs">
                            Suspended
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading === user.id}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {!user.isAdmin && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  type: 'admin',
                                  userId: user.id,
                                  userName: user.name,
                                })
                              }
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Grant Admin Access
                            </DropdownMenuItem>
                          )}

                          {user.isActive && !user.suspended && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'suspend',
                                    userId: user.id,
                                    userName: user.name,
                                  })
                                }
                                className="text-orange-600"
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({
                                    type: 'deactivate',
                                    userId: user.id,
                                    userName: user.name,
                                  })
                                }
                                className="text-destructive"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({
                                type: 'delete',
                                userId: user.id,
                                userName: user.name,
                              })
                            }
                            className="text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && total > 20 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'delete' && 'Delete User'}
              {confirmAction?.type === 'deactivate' && 'Deactivate User'}
              {confirmAction?.type === 'suspend' && 'Suspend User'}
              {confirmAction?.type === 'admin' && 'Grant Admin Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'delete' &&
                `Are you sure you want to permanently delete ${confirmAction.userName}? This action cannot be undone.`}
              {confirmAction?.type === 'deactivate' &&
                `Are you sure you want to deactivate ${confirmAction.userName}? They will no longer be able to access their account.`}
              {confirmAction?.type === 'suspend' &&
                `Are you sure you want to suspend ${confirmAction.userName}? They will be temporarily blocked from using the app.`}
              {confirmAction?.type === 'admin' &&
                `Are you sure you want to grant admin access to ${confirmAction.userName}? They will have access to the admin dashboard.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmAction && handleUserAction(confirmAction.type, confirmAction.userId)
              }
              className={
                confirmAction?.type === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''
              }
            >
              {confirmAction?.type === 'delete' && 'Delete'}
              {confirmAction?.type === 'deactivate' && 'Deactivate'}
              {confirmAction?.type === 'suspend' && 'Suspend'}
              {confirmAction?.type === 'admin' && 'Grant Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
