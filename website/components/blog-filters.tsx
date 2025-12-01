'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface BlogFiltersProps {
  onSearchChange: (search: string) => void;
  onCategoryChange: (categories: string[]) => void;
}

export interface BlogFilterState {
  search: string;
  categories: string[];
}

const CATEGORIES = [
  'Cooking Tips',
  'Beginners',
  'Meal Planning',
  'Productivity',
  'Nutrition',
  'Health',
  'Recipes',
  'Kitchen Tools',
];

export function BlogFilters({ onSearchChange, onCategoryChange }: BlogFiltersProps) {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(newCategories);
    onCategoryChange(newCategories);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    onSearchChange('');
    onCategoryChange([]);
  };

  const hasActiveFilters = search.length > 0 || selectedCategories.length > 0;

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search articles by title, content, or tags..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Category Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Categories</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategories.includes(category)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
              Search: "{search}"
              <button onClick={() => handleSearchChange('')} className="hover:text-primary">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedCategories.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1"
            >
              {category}
              <button
                onClick={() => handleCategoryToggle(category)}
                className="hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

