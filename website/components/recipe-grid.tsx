import { Recipe } from '@/lib/api/recipes';
import { RecipeCard } from './recipe-card';

interface RecipeGridProps {
  recipes: Recipe[];
  isLoading?: boolean;
}

export function RecipeGrid({ recipes, isLoading = false }: RecipeGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/3] rounded-t-lg bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="mb-2 text-xl font-semibold">No recipes found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
