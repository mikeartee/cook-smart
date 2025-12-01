'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RecipeFiltersProps {
  onSearchChange: (search: string) => void;
  onDietaryChange: (dietary: string[]) => void;
  onIngredientChange: (ingredients: string) => void;
  searchValue?: string;
  dietaryValue?: string[];
  ingredientValue?: string;
}

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'High-Protein',
];

export function RecipeFilters({
  onSearchChange,
  onDietaryChange,
  onIngredientChange,
  searchValue = '',
  dietaryValue = [],
  ingredientValue = '',
}: RecipeFiltersProps): React.ReactElement {
  const [search, setSearch] = useState(searchValue);
  const [dietary, setDietary] = useState<string[]>(dietaryValue);
  const [ingredients, setIngredients] = useState(ingredientValue);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedIngredients, setDebouncedIngredients] = useState(ingredients);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Debounce ingredients input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIngredients(ingredients);
    }, 300);

    return () => clearTimeout(timer);
  }, [ingredients]);

  // Notify parent of search changes
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  // Notify parent of ingredient changes
  useEffect(() => {
    onIngredientChange(debouncedIngredients);
  }, [debouncedIngredients, onIngredientChange]);

  // Notify parent of dietary changes
  useEffect(() => {
    onDietaryChange(dietary);
  }, [dietary, onDietaryChange]);

  const handleDietaryToggle = (option: string): void => {
    setDietary((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  const clearAllFilters = (): void => {
    setSearch('');
    setDietary([]);
    setIngredients('');
  };

  const hasActiveFilters = search || dietary.length > 0 || ingredients;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Dietary Preferences Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Dietary Preferences
              {dietary.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {dietary.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Diet</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DIETARY_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option}
                checked={dietary.includes(option)}
                onCheckedChange={() => handleDietaryToggle(option)}
              >
                {option}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Ingredient Search */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Filter by ingredients (e.g., chicken, tomatoes)..."
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
              <span>Search: {search}</span>
              <button
                onClick={() => setSearch('')}
                className="ml-1 hover:text-destructive"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {dietary.map((diet) => (
            <div
              key={diet}
              className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
            >
              <span>{diet}</span>
              <button
                onClick={() => handleDietaryToggle(diet)}
                className="ml-1 hover:text-destructive"
                aria-label={`Remove ${diet} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {ingredients && (
            <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
              <span>Ingredients: {ingredients}</span>
              <button
                onClick={() => setIngredients('')}
                className="ml-1 hover:text-destructive"
                aria-label="Clear ingredient filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
