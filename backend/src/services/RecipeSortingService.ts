export type SortOption = 
  | 'relevance'
  | 'cookingTime'
  | 'difficulty'
  | 'servings'
  | 'alphabetical'
  | 'compatibility';

export interface Recipe {
  id: string;
  title: string;
  cookingTime: number;
  difficulty: string;
  servings: number;
  isCompatible?: boolean;
  conflictCount?: number;
}

export class RecipeSortingService {
  private static difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };

  static sortRecipes(recipes: Recipe[], sortBy: SortOption): Recipe[] {
    const sorted = [...recipes];

    switch (sortBy) {
      case 'cookingTime':
        return sorted.sort((a, b) => a.cookingTime - b.cookingTime);

      case 'difficulty':
        return sorted.sort((a, b) => {
          const aOrder = this.difficultyOrder[a.difficulty.toLowerCase() as keyof typeof this.difficultyOrder] || 999;
          const bOrder = this.difficultyOrder[b.difficulty.toLowerCase() as keyof typeof this.difficultyOrder] || 999;
          return aOrder - bOrder;
        });

      case 'servings':
        return sorted.sort((a, b) => b.servings - a.servings);

      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));

      case 'compatibility':
        return sorted.sort((a, b) => {
          // Compatible recipes first
          if (a.isCompatible && !b.isCompatible) return -1;
          if (!a.isCompatible && b.isCompatible) return 1;
          
          // Then by conflict count (fewer conflicts first)
          const aConflicts = a.conflictCount || 0;
          const bConflicts = b.conflictCount || 0;
          return aConflicts - bConflicts;
        });

      case 'relevance':
      default:
        return sorted; // Keep original order for relevance
    }
  }

  static getSortOptions(): Array<{ value: SortOption; label: string; icon: string }> {
    return [
      { value: 'relevance', label: 'Relevance', icon: '🎯' },
      { value: 'compatibility', label: 'Compatibility', icon: '✅' },
      { value: 'cookingTime', label: 'Cooking Time', icon: '⏱️' },
      { value: 'difficulty', label: 'Difficulty', icon: '📊' },
      { value: 'servings', label: 'Servings', icon: '👥' },
      { value: 'alphabetical', label: 'A-Z', icon: '🔤' }
    ];
  }
}
