import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users, ChefHat, ArrowLeft, Share2, Bookmark } from 'lucide-react';
import { recipeApi, Recipe } from '@/lib/api/recipes';
import { generatePageMetadata } from '@/lib/metadata';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RecipeDisclaimer } from '@/components/recipe-disclaimer';

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

async function getRecipe(id: string): Promise<Recipe | null> {
  try {
    const recipe = await recipeApi.getRecipeById(id);
    return recipe;
  } catch (error) {
    console.error('Failed to fetch recipe:', error);
    return null;
  }
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) {
    return {
      title: 'Recipe Not Found',
    };
  }

  return generatePageMetadata({
    title: recipe.name,
    description: recipe.description,
    ogImage: recipe.imageUrl,
  });
}

export default async function RecipePage({ params }: RecipePageProps): Promise<React.ReactElement> {
  const { id } = React.use(params);
  const recipe = await getRecipe(id);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/recipes"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Health & Safety Disclaimer */}
        <RecipeDisclaimer />

        <div className="grid gap-8 lg:grid-cols-2 mt-8">
          {/* Image */}
          <div className="relative aspect-4/3 overflow-hidden rounded-lg">
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted">
                <ChefHat className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Recipe Info */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center gap-2">
              {recipe.featured && <Badge variant="secondary">Featured</Badge>}
              <Badge variant="outline">{recipe.difficulty}</Badge>
            </div>

            <h1 className="mb-4 text-4xl font-bold">{recipe.name}</h1>
            <p className="mb-6 text-lg text-muted-foreground">{recipe.description}</p>

            {/* Meta Info */}
            <div className="mb-6 flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{recipe.cookingTime}</strong> minutes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{recipe.servings}</strong> servings
                </span>
              </div>
            </div>

            {/* Source Info */}
            {recipe.source === 'themealdb' && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ChefHat className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">TheMealDB</p>
                  <p className="text-sm text-muted-foreground">Recipe Source</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1">
                <Bookmark className="mr-2 h-4 w-4" />
                Save Recipe
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Category and Cuisine Info */}
        {(recipe.category || recipe.cuisine) && (
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 text-2xl font-bold">Recipe Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {recipe.category && (
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="text-lg font-semibold">{recipe.category}</p>
                </div>
              )}
              {recipe.cuisine && (
                <div>
                  <p className="text-sm text-muted-foreground">Cuisine</p>
                  <p className="text-lg font-semibold">{recipe.cuisine}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 text-2xl font-bold">Ingredients</h2>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Checkbox id={`ingredient-${index}`} className="mt-1" />
                  <label
                    htmlFor={`ingredient-${index}`}
                    className="flex-1 cursor-pointer text-base leading-relaxed"
                  >
                    {ingredient.amount && <strong>{ingredient.amount} </strong>}
                    {ingredient.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 text-2xl font-bold">Instructions</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="flex-1 pt-1 text-base leading-relaxed">{instruction}</p>
              </li>
            ))}
          </ol>
        </div>
        )}

        {/* Download CTA */}
        <div className="mt-8 rounded-lg bg-primary p-8 text-center text-primary-foreground">
          <h2 className="mb-2 text-2xl font-bold">Love this recipe?</h2>
          <p className="mb-6 text-lg opacity-90">
            Download the Cook Smart app to save recipes, plan meals, and generate shopping lists!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href={process.env.NEXT_PUBLIC_ANDROID_STORE_URL || '#'}>
                Download for Android
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href={process.env.NEXT_PUBLIC_IOS_STORE_URL || '#'}>
                Download for iOS
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
