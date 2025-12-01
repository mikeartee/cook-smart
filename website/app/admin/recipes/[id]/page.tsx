'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { recipesApi } from '@/lib/api-client';
import { Recipe } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import React from 'react';

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeDetailPage({ params }: RecipeDetailPageProps): React.ReactElement {
  const { id } = React.use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async (): Promise<void> => {
    try {
      const data = await recipesApi.getById(id);
      setRecipe(data as Recipe);
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
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

  if (!recipe) {
    return (
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Recipe Not Found</h1>
        <Button onClick={() => router.push('/admin/recipes')}>Back to Recipes</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/recipes"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Recipe Details</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/recipes/${recipe.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              {recipe.isFeatured && <Badge variant="default"><Star className="mr-1 h-3 w-3" />Featured</Badge>}
              <Badge variant={recipe.status === 'published' ? 'default' : 'secondary'}>
                {recipe.status}
              </Badge>
              {recipe.isFlagged && <Badge variant="destructive">Flagged</Badge>}
            </div>

            <div className="relative mb-6 aspect-video overflow-hidden rounded-lg">
              {recipe.imageUrl ? (
                <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-6xl">🍳</div>
              )}
            </div>

            <h2 className="mb-2 text-2xl font-bold">{recipe.title}</h2>
            <p className="mb-4 text-muted-foreground">{recipe.description}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{recipe.cookingTime}</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{recipe.servings}</p>
                <p className="text-sm text-muted-foreground">Servings</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{recipe.nutritionalInfo.calories}</p>
                <p className="text-sm text-muted-foreground">Calories</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-medium">{ing.amount} {ing.unit}</span>
                    <span>{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((inst, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Author</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {recipe.author.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{recipe.author.name}</p>
                <p className="text-sm text-muted-foreground">{recipe.author.email}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Nutrition</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Calories</span>
                <span className="font-medium">{recipe.nutritionalInfo.calories}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Protein</span>
                <span className="font-medium">{recipe.nutritionalInfo.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Carbs</span>
                <span className="font-medium">{recipe.nutritionalInfo.carbs}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fat</span>
                <span className="font-medium">{recipe.nutritionalInfo.fat}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fiber</span>
                <span className="font-medium">{recipe.nutritionalInfo.fiber}g</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Metadata</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>{' '}
                <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>{' '}
                <span>{new Date(recipe.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
