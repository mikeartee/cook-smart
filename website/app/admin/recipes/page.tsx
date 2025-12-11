'use client';

import { useState, useEffect } from 'react';
import { Search, Star, Eye, MoreVertical, Edit, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { recipesApi } from '@/lib/api-client';
import { Recipe } from '@/types';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function RecipesManagementPage(): React.ReactElement {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { refreshTrigger } = usePageRefresh('recipes');
  const { toast } = useToast();

  useEffect(() => {
    fetchRecipes();
  }, [search, statusFilter, page, refreshTrigger]);

  const fetchRecipes = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      console.log('Fetching recipes with params:', params);
      const response = await recipesApi.getAll(params);

      setRecipes(response.recipes as Recipe[]);
      setTotal(response.total);
      setSelectedRecipes(new Set());
      setLastUpdated(new Date());

      if (refreshTrigger > 0) {
        toast({
          title: 'Recipes Updated',
          description: 'Recipe data has been refreshed successfully.',
        });
      }
    } catch (fetchError) {
      console.error('Failed to fetch recipes:', fetchError);
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : 'Failed to load recipes';
      setError(errorMessage);

      toast({
        title: 'Error',
        description: 'Failed to load recipes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecipeSelection = (id: string): void => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecipes(newSelected);
  };

  const toggleSelectAll = (): void => {
    if (selectedRecipes.size === recipes.length) {
      setSelectedRecipes(new Set());
    } else {
      setSelectedRecipes(new Set(recipes.map((r) => r.id)));
    }
  };

  const handleBulkApprove = async (): Promise<void> => {
    if (selectedRecipes.size === 0) return;

    if (!confirm(`Approve ${selectedRecipes.size} selected recipe(s)?`)) return;

    try {
      setIsProcessing(true);
      await recipesApi.bulkUpdate(Array.from(selectedRecipes), { status: 'published' });

      toast({
        title: 'Success',
        description: `${selectedRecipes.size} recipe(s) approved successfully.`,
      });

      fetchRecipes();
    } catch (err) {
      console.error('Failed to approve recipes:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve recipes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async (): Promise<void> => {
    if (selectedRecipes.size === 0) return;

    if (!confirm(`Reject ${selectedRecipes.size} selected recipe(s)?`)) return;

    try {
      setIsProcessing(true);
      await recipesApi.bulkUpdate(Array.from(selectedRecipes), { status: 'draft' });
      alert('Recipes rejected successfully');
      fetchRecipes();
    } catch (rejectError) {
      console.error('Failed to reject recipes:', rejectError);
      alert('Failed to reject recipes');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedRecipes.size === 0) return;

    if (
      !confirm(`Delete ${selectedRecipes.size} selected recipe(s)? This action cannot be undone.`)
    )
      return;

    try {
      setIsProcessing(true);
      await recipesApi.bulkDelete(Array.from(selectedRecipes));
      alert('Recipes deleted successfully');
      fetchRecipes();
    } catch (deleteError) {
      console.error('Failed to delete recipes:', deleteError);
      alert('Failed to delete recipes');
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Recipe Management</h1>
            <p className="text-muted-foreground">Manage and curate community recipes</p>
          </div>
          <AdminRefreshButton pageId="recipes" />
        </div>

        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold">Failed to Load Recipes</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <AdminRefreshButton pageId="recipes" variant="default">
              Try Again
            </AdminRefreshButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Recipe Management</h1>
          <p className="text-muted-foreground">Manage and curate community recipes</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <AdminRefreshButton pageId="recipes" />
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search recipes..."
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
            variant={statusFilter === 'published' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('published')}
            size="sm"
          >
            Published
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('draft')}
            size="sm"
          >
            Draft
          </Button>
        </div>
      </div>

      {selectedRecipes.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted p-4">
          <span className="font-medium">
            {selectedRecipes.size} recipe{selectedRecipes.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={handleBulkApprove} disabled={isProcessing}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkReject} disabled={isProcessing}>
              Reject
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {!isLoading && recipes.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedRecipes.size === recipes.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-muted-foreground">Select all on this page</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border p-4">
              <div className="mb-3 aspect-4/3 rounded bg-muted"></div>
              <div className="mb-2 h-4 w-3/4 rounded bg-muted"></div>
              <div className="h-3 w-full rounded bg-muted"></div>
            </div>
          ))
        ) : recipes.length === 0 ? (
          <div className="col-span-full rounded-lg border p-12 text-center">
            <p className="text-muted-foreground">No recipes found</p>
          </div>
        ) : (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="group rounded-lg border bg-background transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-4/3 overflow-hidden rounded-t-lg">
                <div className="absolute left-2 top-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedRecipes.has(recipe.id)}
                    onChange={() => toggleRecipeSelection(recipe.id)}
                    className="h-5 w-5 rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {recipe.imageUrl ? (
                  <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <span className="text-4xl">🍳</span>
                  </div>
                )}
                {recipe.isFeatured && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                    <Star className="inline h-3 w-3" /> Featured
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2">{recipe.title}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/recipes/${recipe.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/recipes/${recipe.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {recipe.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant={recipe.status === 'published' ? 'default' : 'secondary'}>
                    {recipe.status}
                  </Badge>
                  <span className="text-muted-foreground">by {recipe.author.name}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && total > 20 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} recipes
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
  );
}
